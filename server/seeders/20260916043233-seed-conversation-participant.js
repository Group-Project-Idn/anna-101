'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const participants = require('../../db/conversation_participants.json');
    participants.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert('ConversationParticipants', participants, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ConversationParticipants', null, {});
  }
};
