'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Quotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      stock_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Stocks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      current_price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      change: {
        type: Sequelize.FLOAT
      },
      change_percent: {
        type: Sequelize.FLOAT
      },
      high: {
        type: Sequelize.FLOAT
      },
      low: {
        type: Sequelize.FLOAT
      },
      open: {
        type: Sequelize.FLOAT
      },
      previous_close: {
        type: Sequelize.FLOAT
      },
      fetched_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Quotes');
  }
};