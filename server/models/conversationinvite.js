'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ConversationInvite extends Model {
    static associate(models) {
      ConversationInvite.belongsTo(models.Lesson, { foreignKey: 'lesson_id', as: 'lesson' });
      ConversationInvite.belongsTo(models.User, { foreignKey: 'from_user_id', as: 'from_user' });
      ConversationInvite.belongsTo(models.User, { foreignKey: 'to_user_id', as: 'to_user' });
      ConversationInvite.hasOne(models.Conversation, { foreignKey: 'invite_id', as: 'conversation' });
    }
  }
  ConversationInvite.init({
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'ConversationInvite',
    tableName: 'ConversationInvites',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return ConversationInvite;
};
