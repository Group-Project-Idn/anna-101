const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;

const signToken = (payload) => {
  return jwt.sign(payload, secretKey);
};

const verifyToken = (access_token) => {
  return jwt.verify(access_token, secretKey);
};

module.exports = { signToken, verifyToken };
