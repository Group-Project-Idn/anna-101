const { User, Pathway, Lesson, UserLessonProgress } = require("../models");

class ControllerPathways {
  // GET /api/pathways
  static async read(req, res, next) {
    try {
      const pathways = await Pathway.findAll({
        attributes: ["id", "name", "level", "cefr_level"],
      });

      res.status(200).json(pathways);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pathways/:id/lessons
  static async readStatus(req, res, next) {
    try {
      const pathwayId = req.params.id;

      const pathway = await Pathway.findByPk(pathwayId);
      if (!pathway) throw { name: "NotFound" };

      const lessons = await Lesson.findAll({
        where: { pathway_id: pathwayId },
        order: [["order", "ASC"]],
      });

      const userId = req.loginInfo.userId;
      const progresses = lessons.length
        ? await UserLessonProgress.findAll({
            where: { user_id: userId, lesson_id: lessons.map((l) => l.id) },
          })
        : [];

      const progressMap = {};
      progresses.forEach((progress) => {
        progressMap[progress.lesson_id] = progress;
      });

      let prevCompleted = true;
      const result = lessons.map((lesson) => {
        const progress = progressMap[lesson.id];
        let status;
        let score = null;

        if (progress && progress.status === "completed") {
          status = "completed";
          score = progress.score;
        } else if (progress && progress.status === "in_progress") {
          status = "unlocked";
        } else if (prevCompleted) {
          status = "unlocked";
        } else {
          status = "locked";
        }

        prevCompleted = !!(progress && progress.status === "completed");

        return {
          id: lesson.id,
          title: lesson.title,
          status,
          score,
        };
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControllerPathways;
