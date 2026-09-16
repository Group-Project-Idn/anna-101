const { User } = require("../models");

class Controller {
  static async register(req, res, next) {
    try {
      const { email, password } = req.body;
      console.log(email, password);

      const data = await User.create({ email, password });

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

      const user = await User.findOne({ email });

      if (!user) throw { name: "Unauthorized" };

      if (!comparePass(password, user.password)) throw { name: "Unauthorized" };

      const payload = {
        id: user.id,
        email: user.email,
      };

      const access_token = signToken(payload);

      res.status(200).json({ access_token: access_token });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = Controller;
