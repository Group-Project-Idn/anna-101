const { comparePass } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { User } = require("../models");

class Controller {
  static async register(req, res, next) {
    try {
      const { name, username, email, password, current_pathway_id } = req.body;

      const data = await User.create({
        name,
        username,
        email,
        password,
        current_pathway_id,
      });

      const payload = {
        id: data.id,
        name: data.name,
        email: data.email,
      };

      const token = signToken(payload);

      res
        .status(201)
        .json({
          user: { id: data.id, name: data.name, username: data.username },
          token,
        });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) throw { name: "InvalidLogin" };
      if (!password) throw { name: "InvalidLogin" };

      const user = await User.findOne({ where: { email } });

      if (!user) throw { name: "LoginError" };

      if (!comparePass(password, user.password)) throw { name: "LoginError" };

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      const token = signToken(payload);

      res.status(200).json({
        user: { id: user.id, name: user.name, username: user.username },
        token,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
