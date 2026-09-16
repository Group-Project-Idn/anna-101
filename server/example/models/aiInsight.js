const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AiInsight extends Model {
    static associate(models) {
      AiInsight.belongsTo(models.Stock, { foreignKey: 'stock_id' });
    }
  }

  AiInsight.init(
    {
      stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      generated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'AiInsight',
      tableName: 'AiInsights',
      createdAt: false,
      updatedAt: false,
    },
  );

  return AiInsight;
};
