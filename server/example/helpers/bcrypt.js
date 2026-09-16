const bcrypt = require('bcryptjs');

const hashPassword = (pass) => {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(pass, salt);
  return hash;
};

const comparePassword = (pass, hashPass) => {
  return bcrypt.compareSync(pass, hashPass);
};

module.exports = { hashPassword, comparePassword };
