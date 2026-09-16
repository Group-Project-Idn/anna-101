'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'google_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      ADD CONSTRAINT chk_auth_method
      CHECK (google_id IS NOT NULL OR password IS NOT NULL)
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users"
      DROP CONSTRAINT chk_auth_method
    `);

    await queryInterface.changeColumn('Users', 'google_id', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  }
};