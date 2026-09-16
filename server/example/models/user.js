const { Model } = require('sequelize');
const { hashPassword } = require('../helpers/bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Watchlist, { foreignKey: 'user_id' });
    }
  }

  User.init(
    {
      google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Email must be a valid email address.',
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

  User.beforeCreate((user) => {
    if (user.password) {
      user.password = hashPassword(user.password);
    }
  });

  User.beforeUpdate((user) => {
    if (user.changed('password') && user.password) {
      user.password = hashPassword(user.password);
    }
  });

  return User;
};
