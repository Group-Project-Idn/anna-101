'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const conversations = require('../../db/conversations.json');
    conversations.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert('Conversations', conversations, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Conversations', null, {});
  }
};
