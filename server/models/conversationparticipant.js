'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ConversationParticipant extends Model {
    static associate(models) {
      ConversationParticipant.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
      ConversationParticipant.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  ConversationParticipant.init({
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ConversationParticipant',
    tableName: 'ConversationParticipants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return ConversationParticipant;
};
