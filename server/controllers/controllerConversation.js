const {
  Conversation,
  ConversationParticipant,
  Message,
  User,
} = require("../models");

class ControllerConversation {
  static async read(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.loginInfo;

      const conversation = await Conversation.findByPk(id, {
        attributes: { exclude: ["user_id"] },
      });

      if (!conversation) throw { name: "NotFound" };

      const participant = await ConversationParticipant.findOne({
        where: { conversation_id: id, user_id: userId },
      });

      if (!participant) throw { name: "Forbidden" };

      const participants = await ConversationParticipant.findAll({
        where: { conversation_id: id },
        include: [{ model: User, as: "user", attributes: ["username"] }],
      });

      res.status(200).json({
        id: conversation.id,
        lesson_id: conversation.lesson_id,
        status: conversation.status,
        participants: participants.map((item) => ({
          user_id: item.user_id,
          username: item.user ? item.user.username : null,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async readMessages(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.loginInfo;

      const conversation = await Conversation.findByPk(id, {
        attributes: { exclude: ["user_id"] },
      });

      if (!conversation) throw { name: "NotFound" };

      const participant = await ConversationParticipant.findOne({
        where: { conversation_id: id, user_id: userId },
      });

      if (!participant) throw { name: "Forbidden" };

      const messages = await Message.findAll({
        where: { conversation_id: id },
        order: [["created_at", "ASC"]],
      });

      res.status(200).json(
        messages.map((item) => ({
          id: item.id,
          sender_type: item.sender_type,
          sender_id: item.sender_id,
          message_type: item.message_type,
          content: item.content,
        })),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControllerConversation;
