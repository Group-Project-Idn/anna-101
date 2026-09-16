'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const vocabularyWords = require('../../db/vocabulary_words.json');
    vocabularyWords.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert('VocabularyWords', vocabularyWords, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('VocabularyWords', null, {});
  }
};
