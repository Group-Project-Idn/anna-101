const bcrypt = require("bcryptjs");

const hashPass = (password) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
};

const comparePass = (password, hashedPass) => {
  return bcrypt.compareSync(password, hashedPass);
};

module.exports = { hashPass, comparePass };
