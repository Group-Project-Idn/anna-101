'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Watchlists', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
      added_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addConstraint('Watchlists', {
      fields: ['user_id', 'stock_id'],
      type: 'unique',
      name: 'uq_watchlist_user_stock'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Watchlists');
  }
};