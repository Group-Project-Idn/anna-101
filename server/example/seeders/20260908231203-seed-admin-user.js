'use strict';
const { hashPassword } = require('../helpers/bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.bulkInsert('Users', [
      {
        google_id: 'default-google-id',
        email: 'admin@mail.com',
        name: 'Admin',
        password: hashPassword("admin"),
        avatar_url: null,
        created_at: new Date(),
        last_login_at: null
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'admin@mail.com' }, {});
  }
};