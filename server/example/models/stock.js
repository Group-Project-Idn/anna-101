const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    static associate(models) {
      Stock.hasOne(models.Quote, { foreignKey: 'stock_id' });
      Stock.hasMany(models.Candle, { foreignKey: 'stock_id' });
      Stock.hasMany(models.News, { foreignKey: 'stock_id' });
      Stock.hasMany(models.AiInsight, { foreignKey: 'stock_id' });
      Stock.hasMany(models.Watchlist, { foreignKey: 'stock_id' });
    }
  }

  Stock.init(
    {
      symbol: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sector: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      exchange: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'US',
      },
      regulator: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'SEC',
      },
      logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      market_cap: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      pe_ratio: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      week52_high: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      week52_low: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      beta: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Stock',
      tableName: 'Stocks',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return Stock;
};
