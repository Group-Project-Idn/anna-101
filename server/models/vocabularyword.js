'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VocabularyWord extends Model {
    static associate(models) {
      VocabularyWord.belongsTo(models.Lesson, { foreignKey: 'lesson_id', as: 'lesson' });
    }
  }
  VocabularyWord.init({
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    word: {
      type: DataTypes.STRING,
      allowNull: false
    },
    meaning: DataTypes.STRING,
    example_sentence: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'VocabularyWord',
    tableName: 'VocabularyWords',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return VocabularyWord;
};
