'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stocks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      symbol: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sector: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      exchange: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(5),
        allowNull: false,
        defaultValue: 'US'
      },
      regulator: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'SEC'
      },
      logo_url: {
        type: Sequelize.STRING(500)
      },
      market_cap: {
        type: Sequelize.FLOAT
      },
      pe_ratio: {
        type: Sequelize.FLOAT
      },
      week52_high: {
        type: Sequelize.FLOAT
      },
      week52_low: {
        type: Sequelize.FLOAT
      },
      beta: {
        type: Sequelize.FLOAT
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addConstraint('Stocks', {
      fields: ['symbol', 'exchange'],
      type: 'unique',
      name: 'uq_stock_symbol_exchange'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stocks');
  }
};