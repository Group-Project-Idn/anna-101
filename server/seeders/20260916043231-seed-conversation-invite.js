'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const invites = require('../../db/conversation_invites.json');
    invites.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert('ConversationInvites', invites, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ConversationInvites', null, {});
  }
};
