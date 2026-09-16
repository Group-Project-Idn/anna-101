"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const pathways = require("../../db/pathways.json");
    pathways.forEach((el) => {
      el.created_at = el.updated_at = new Date();
    });
    await queryInterface.bulkInsert("Pathways", pathways, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Pathways", null, {});
  },
};
