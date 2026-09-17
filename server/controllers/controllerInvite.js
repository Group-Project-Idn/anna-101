const {
  User,
  Lesson,
  ConversationInvite,
  UserLessonProgress,
  sequelize,
} = require("../models");
const db = require("../models");

class ControllerInvite {
  static async lessonStatusForUser(lesson, user_id) {
    const lessons = await Lesson.findAll({
      where: { pathway_id: lesson.pathway_id },
      order: [["order", "ASC"]],
    });

    const progresses = lessons.length
      ? await UserLessonProgress.findAll({
          where: { user_id, lesson_id: lessons.map((item) => item.id) },
        })
      : [];

    const progressMap = {};
    progresses.forEach((progress) => {
      progressMap[progress.lesson_id] = progress;
    });

    let prevCompleted = true;
    const statuses = lessons.map((item) => {
      const progress = progressMap[item.id];
      let status;

      if (progress && progress.status === "completed") {
        status = "completed";
      } else if (progress && progress.status === "in_progress") {
        status = "unlocked";
      } else if (prevCompleted) {
        status = "unlocked";
      } else {
        status = "locked";
      }

      prevCompleted = !!(progress && progress.status === "completed");

      return { id: item.id, status };
    });

    const found = statuses.find((item) => item.id === lesson.id);
    return found ? found.status : "unlocked";
  }

  static async create(req, res, next) {
    try {
      const { userId: user_id } = req.loginInfo;
      const { lesson_id, to_username } = req.body;

      if (!lesson_id || !to_username) {
        throw {
          name: "BadRequest",
          message: "lesson_id and to_username are required.",
        };
      }

      const lesson = await Lesson.findByPk(lesson_id);
      if (!lesson) {
        throw { name: "NotFound", message: "Lesson not found." };
      }

      const toUser = await User.findOne({ where: { username: to_username } });
      if (!toUser) {
        throw { name: "BadRequest", message: "Username not found." };
      }

      if (toUser.id === user_id) {
        throw { name: "BadRequest", message: "You cannot invite yourself." };
      }

      const lessonStatus = await ControllerInvite.lessonStatusForUser(
        lesson,
        user_id,
      );
      if (lessonStatus === "locked") {
        throw { name: "BadRequest", message: "Lesson is still locked." };
      }

      const invite = await ConversationInvite.create({
        lesson_id: lesson.id,
        from_user_id: user_id,
        to_user_id: toUser.id,
        status: "pending",
      });

      res.status(201).json({
        id: invite.id,
        lesson_id: invite.lesson_id,
        to_username: toUser.username,
        status: invite.status,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req, res, next) {
    try {
      const { userId: user_id } = req.loginInfo;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;

      const incoming = await ConversationInvite.findAll({
        where: { to_user_id: user_id },
        include: [
          { model: User, as: "from_user", attributes: ["id", "username"] },
          {
            model: Lesson,
            as: "lesson",
            attributes: ["id", "title"],
            include: [
              { model: db.Pathway, as: "pathway", attributes: ["id", "level"] },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      const outgoing = await ConversationInvite.findAll({
        where: { from_user_id: user_id },
        include: [
          { model: User, as: "to_user", attributes: ["id", "username"] },
          {
            model: Lesson,
            as: "lesson",
            attributes: ["id", "title"],
            include: [
              { model: db.Pathway, as: "pathway", attributes: ["id", "level"] },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      res.status(200).json({
        incoming: incoming.map((invite) => ({
          id: invite.id,
          from_user_id: invite.from_user?.id || null,
          from_username: invite.from_user?.username || null,
          lesson_id: invite.lesson?.id || null,
          lesson_title: invite.lesson?.title || null,
          pathway_id: invite.lesson?.pathway?.id || null,
          pathway_level: invite.lesson?.pathway?.level || null,
          status: invite.status,
          created_at: invite.created_at,
        })),
        outgoing: outgoing.map((invite) => ({
          id: invite.id,
          to_user_id: invite.to_user?.id || null,
          to_username: invite.to_user?.username || null,
          lesson_id: invite.lesson?.id || null,
          lesson_title: invite.lesson?.title || null,
          pathway_id: invite.lesson?.pathway?.id || null,
          pathway_level: invite.lesson?.pathway?.level || null,
          status: invite.status,
          created_at: invite.created_at,
        })),
        meta: { limit, offset },
      });
    } catch (error) {
      next(error);
    }
  }

  // Buat Conversation + 2 ConversationParticipants dari invite yang sudah
  // accepted. HARUS dipanggil di dalam transaction yang sama dengan update
  // status invite — dipakai bersama oleh REST accept dan socket invite:respond.
  static async createConversationFromInvite(invite, transaction) {
    const [rows] = await sequelize.query(
      'INSERT INTO "Conversations" ("invite_id", "lesson_id", "status", "started_at", "created_at", "updated_at") VALUES (:invite_id, :lesson_id, \'demo\', NOW(), NOW(), NOW()) RETURNING "id"',
      {
        replacements: {
          invite_id: invite.id,
          lesson_id: invite.lesson_id,
        },
        transaction,
      },
    );

    const created = { id: rows[0].id };

    const query =
      'INSERT INTO "ConversationParticipants" ("conversation_id", "user_id", "joined_at", "created_at", "updated_at") ' +
      "VALUES (:conversation_id, :from_user_id, NOW(), NOW(), NOW()), " +
      "(:conversation_id, :to_user_id, NOW(), NOW(), NOW())";

    await sequelize.query(query, {
      replacements: {
        conversation_id: created.id,
        from_user_id: invite.from_user_id,
        to_user_id: invite.to_user_id,
      },
      transaction,
    });

    return created;
  }

  static async accept(req, res, next) {
    try {
      const { userId: user_id } = req.loginInfo;
      const { id } = req.params;

      const invite = await ConversationInvite.findByPk(id);
      if (!invite) {
        throw { name: "NotFound", message: "Invite not found." };
      }

      if (invite.to_user_id !== user_id) {
        throw {
          name: "Forbidden",
          message: "Only the invited user can accept this invite.",
        };
      }

      if (invite.status !== "pending") {
        throw {
          name: "BadRequest",
          message: "Invite has already been responded.",
        };
      }

      const conversation = await sequelize.transaction(async (t) => {
        await invite.update({ status: "accepted" }, { transaction: t });
        return ControllerInvite.createConversationFromInvite(invite, t);
      });

      res.status(200).json({
        invite_id: invite.id,
        status: "accepted",
        conversation_id: conversation.id,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req, res, next) {
    try {
      const { userId: user_id } = req.loginInfo;
      const { id } = req.params;

      const invite = await ConversationInvite.findByPk(id);
      if (!invite) {
        throw { name: "NotFound", message: "Invite not found." };
      }

      if (invite.to_user_id !== user_id) {
        throw {
          name: "Forbidden",
          message: "Only the invited user can reject this invite.",
        };
      }

      if (invite.status !== "pending") {
        throw {
          name: "BadRequest",
          message: "Invite has already been responded.",
        };
      }

      await invite.update({ status: "rejected" });

      res.status(200).json({
        invite_id: invite.id,
        status: "rejected",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControllerInvite;
