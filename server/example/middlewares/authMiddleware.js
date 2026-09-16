const { verifyToken } = require('../helpers/jwt');
const { User } = require('../models');

const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw { name: 'Unauthorized' };
    }

    const token = authorization.split(' ')[1];
    const payload = verifyToken(token);

    const user = await User.findOne({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      throw { name: 'Unauthorized' };
    }

    req.loginInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authentication };
