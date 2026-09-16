'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SessionEvaluation extends Model {
    static associate(models) {
      SessionEvaluation.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
      SessionEvaluation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  SessionEvaluation.init({
    conversation_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    strengths: DataTypes.TEXT,
    evaluation: DataTypes.TEXT,
    score: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SessionEvaluation',
    tableName: 'SessionEvaluations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return SessionEvaluation;
};
