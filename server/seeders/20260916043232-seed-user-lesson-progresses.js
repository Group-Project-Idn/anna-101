'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const userLessonProgresses = require('../../db/user_lesson_progresses.json');
    userLessonProgresses.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert('UserLessonProgresses', userLessonProgresses, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('UserLessonProgresses', null, {});
  }
};
