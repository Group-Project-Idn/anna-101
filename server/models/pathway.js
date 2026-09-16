'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pathway extends Model {
    static associate(models) {
      Pathway.hasMany(models.Lesson, { foreignKey: 'pathway_id', as: 'lessons' });
      Pathway.hasMany(models.User, { foreignKey: 'current_pathway_id', as: 'users' });
    }
  }
  Pathway.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    level: DataTypes.INTEGER,
    cefr_level: DataTypes.STRING,
    order: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Pathway',
    tableName: 'Pathways',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return Pathway;
};
