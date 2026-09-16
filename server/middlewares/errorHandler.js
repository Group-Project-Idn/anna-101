const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = "Internal server error";

  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    status = 400;
    message = err.errors[0].message;
  }

  if (
    err.name === "SequelizeDatabaseError" ||
    err.name === "SequelizeForeignKeyConstraintError"
  ) {
    status = 400;
    message = "Invalid input";
  }

  if (err.name === "InvalidLogin") {
    status = 401;
    message = "Please input email or password";
  }

  if (err.name === "LoginError") {
    status = 401;
    message = "Invalid email or password";
  }

  if (err.name === "Unauthorized" || err.name === "JsonWebTokenError") {
    status = 401;
    message = "Please login first";
  }

  if (err.name === "Forbidden") {
    status = 403;
    message = "You don't have any access";
  }

  if (err.name === "NotFound") {
    status = 404;
    message = "Data not found";
  }

  res.status(status).json({ message });
};

module.exports = errorHandler;
