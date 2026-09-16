const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class News extends Model {
    static associate(models) {
      News.belongsTo(models.Stock, { foreignKey: 'stock_id' });
    }
  }

  News.init(
    {
      stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      headline: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      published_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'News',
      tableName: 'News',
      createdAt: false,
      updatedAt: false,
    },
  );

  return News;
};
