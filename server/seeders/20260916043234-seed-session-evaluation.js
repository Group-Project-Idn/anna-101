'use strict';
/** @type {import('sequelize-cli').Migration) */
module.exports = {
  async up (queryInterface, Sequelize) {
    const evaluations = require('../../db/session_evaluations.json');
    evaluations.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert('SessionEvaluations', evaluations, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SessionEvaluations', null, {});
  }
};
