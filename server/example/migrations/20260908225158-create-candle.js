'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Candles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      open: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      high: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      low: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      close: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      volume: {
        type: Sequelize.BIGINT
      },
      interval: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'daily'
      }
    });

    await queryInterface.addConstraint('Candles', {
      fields: ['stock_id', 'date', 'interval'],
      type: 'unique',
      name: 'uq_candle_stock_date_interval'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Candles');
  }
};