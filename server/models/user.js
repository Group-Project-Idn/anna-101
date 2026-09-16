'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Pathway, { foreignKey: 'current_pathway_id', as: 'current_pathway' });
      User.hasMany(models.UserLessonProgress, { foreignKey: 'user_id', as: 'lesson_progress' });
      User.hasMany(models.Conversation, { foreignKey: 'user_id', as: 'conversations' });
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    current_pathway_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });
  return User;
};
