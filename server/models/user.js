"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Pathway, {
        foreignKey: "current_pathway_id",
        as: "current_pathway",
      });
      User.hasMany(models.UserLessonProgress, {
        foreignKey: "user_id",
        as: "lesson_progress",
      });
      User.hasMany(models.Conversation, {
        foreignKey: "user_id",
        as: "conversations",
      });
      User.hasMany(models.ConversationInvite, {
        foreignKey: "from_user_id",
        as: "sent_invites",
      });
      User.hasMany(models.ConversationInvite, {
        foreignKey: "to_user_id",
        as: "received_invites",
      });
      User.hasMany(models.ConversationParticipant, {
        foreignKey: "user_id",
        as: "participants",
      });
      User.hasMany(models.Message, { foreignKey: "sender_id", as: "messages" });
      User.hasMany(models.SessionEvaluation, {
        foreignKey: "user_id",
        as: "evaluations",
      });
    }
  }
  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      current_pathway_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    },
  );

  User.beforeCreate((user) => {
    user.password_hash = hashPass(user.password_hash);
  });
  return User;
};
