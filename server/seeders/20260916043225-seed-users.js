"use strict";

const { hashPass } = require("../helpers/bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = require("../../db/users.json");
    users.forEach((el) => {
      el.password = hashPass(el.password);
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert("Users", users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
