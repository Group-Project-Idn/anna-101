'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lesson extends Model {
    static associate(models) {
      Lesson.belongsTo(models.Pathway, { foreignKey: 'pathway_id', as: 'pathway' });
      Lesson.hasMany(models.VocabularyWord, { foreignKey: 'lesson_id', as: 'vocabulary_words' });
      Lesson.hasMany(models.UserLessonProgress, { foreignKey: 'lesson_id', as: 'user_progress' });
      Lesson.hasMany(models.Conversation, { foreignKey: 'lesson_id', as: 'conversations' });
    }
  }
  Lesson.init({
    pathway_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    topic_prompt: DataTypes.TEXT,
    order: DataTypes.INTEGER,
    estimated_minutes: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Lesson',
    tableName: 'Lessons',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return Lesson;
};
