"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Conversations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      invite_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ConversationInvites",
          key: "id",
        },
      },
      lesson_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Lessons",
          key: "id",
        },
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ended_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        field: "created_at",
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        field: "updated_at",
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Conversations");
  },
};
