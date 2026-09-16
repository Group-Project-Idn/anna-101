'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Conversation.belongsTo(models.Lesson, { foreignKey: 'lesson_id', as: 'lesson' });
      Conversation.hasMany(models.Message, { foreignKey: 'conversation_id', as: 'messages' });
    }
  }
  Conversation.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    ended_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'Conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return Conversation;
};
