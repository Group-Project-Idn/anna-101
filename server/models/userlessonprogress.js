'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserLessonProgress extends Model {
    static associate(models) {
      UserLessonProgress.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      UserLessonProgress.belongsTo(models.Lesson, { foreignKey: 'lesson_id', as: 'lesson' });
    }
  }
  UserLessonProgress.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'not_started'
    },
    score: DataTypes.INTEGER,
    completed_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserLessonProgress',
    tableName: 'UserLessonProgresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return UserLessonProgress;
};
