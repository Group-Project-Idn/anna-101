const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) throw { name: "Unauthorized" };

    const access_token = authorization.split(" ")[1];

    const payload = verifyToken(access_token);

    const user = await User.findByPk(payload.id);

    if (!user) throw { name: "Unauthorized" };

    req.loginInfo = {
      userId: payload.id,
      userName: payload.name,
      userEmail: payload.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authentication;
