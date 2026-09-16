const { comparePass } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { User } = require("../models");

class Controller {
  static async register(req, res, next) {
    try {
      const { name, username, email, password } = req.body;
      console.log(name, username, email, password);

      const data = await User.create({ name, username, email, password });

      res.status(201).json({ id: data.id, email: data.email });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) throw { name: "InvalidLogin" };
      if (!password) throw { name: "InvalidLogin" };

      const user = await User.findOne({ where: { email } });

      if (!user) throw { name: "Unauthorized" };

      if (!comparePass(password, user.password)) throw { name: "Unauthorized" };

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
      console.log(payload);

      const access_token = signToken(payload);

      res.status(200).json({ access_token: access_token });
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
}

module.exports = Controller;
