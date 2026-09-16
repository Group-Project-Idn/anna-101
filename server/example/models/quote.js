const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Quote extends Model {
    static associate(models) {
      Quote.belongsTo(models.Stock, { foreignKey: 'stock_id' });
    }
  }

  Quote.init(
    {
      stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      current_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      change: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      change_percent: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      high: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      low: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      open: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      previous_close: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      fetched_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Quote',
      tableName: 'Quotes',
      createdAt: false,
      updatedAt: false,
    },
  );

  return Quote;
};
