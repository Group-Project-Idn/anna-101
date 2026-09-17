"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.belongsTo(models.ConversationInvite, {
        foreignKey: "invite_id",
        as: "invite",
      });
      Conversation.belongsTo(models.Lesson, {
        foreignKey: "lesson_id",
        as: "lesson",
      });
      Conversation.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      Conversation.hasMany(models.ConversationParticipant, {
        foreignKey: "conversation_id",
        as: "participants",
      });
      Conversation.hasMany(models.Message, {
        foreignKey: "conversation_id",
        as: "messages",
      });
      Conversation.hasMany(models.SessionEvaluation, {
        foreignKey: "conversation_id",
        as: "evaluations",
      });
    }
  }
  Conversation.init(
    {
      invite_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      ended_at: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Conversation",
      tableName: "Conversations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    },
  );
  return Conversation;
};
