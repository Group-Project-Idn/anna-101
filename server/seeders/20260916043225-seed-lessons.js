'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const lessons = require('../../db/lessons.json');
    lessons.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert('Lessons', lessons, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Lessons', null, {});
  }
};
