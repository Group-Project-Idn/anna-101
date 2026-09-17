const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Watchlist extends Model {
    static associate(models) {
      Watchlist.belongsTo(models.User, { foreignKey: 'user_id' });
      Watchlist.belongsTo(models.Stock, { foreignKey: 'stock_id' });
    }
  }

  Watchlist.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      added_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Watchlist',
      tableName: 'Watchlists',
      createdAt: false,
      updatedAt: false,
    },
  );

  return Watchlist;
};
