'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('News', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      stock_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stocks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      headline: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      summary: {
        type: Sequelize.TEXT
      },
      source: {
        type: Sequelize.STRING(100)
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      image_url: {
        type: Sequelize.STRING(500)
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('News');
  }
};