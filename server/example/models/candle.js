const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Candle extends Model {
    static associate(models) {
      Candle.belongsTo(models.Stock, { foreignKey: 'stock_id' });
    }
  }

  Candle.init(
    {
      stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      open: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      high: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      low: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      close: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      volume: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      interval: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '1day',
      },
    },
    {
      sequelize,
      modelName: 'Candle',
      tableName: 'Candles',
      createdAt: false,
      updatedAt: false,
    },
  );

  return Candle;
};
