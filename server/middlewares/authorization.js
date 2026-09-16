const authorization = async (req, resizeBy, next) => {
  try {
    const { userId } = req.loginInfo;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authorization;
