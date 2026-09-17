'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
      Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender', allowNull: true });
    }
  }
  Message.init({
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER
    },
    sender_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    },
    message_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'chat'
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return Message;
};
