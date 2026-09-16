function errorHandler(err, req, res, next) {
  console.log(err);
  let status = 500;
  let message = 'Internal server error.';

  if (err.name === 'SequelizeDatabaseError' || err.name === 'SequelizeForeignKeyConstraintError') {
    status = 400;
    message = 'Invalid input.';
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    status = 400;
    message = err.errors[0].message;
  }

  if (err.name === 'BadRequest') {
    status = 400;
    message = err.message || 'Bad request.';
  }

  if (err.name === 'Unauthorized' || err.name === 'JsonWebTokenError') {
    status = 401;
    message = err.message || 'Unauthorized.';
  }

  if (err.name === 'Forbidden') {
    status = 403;
    message = err.message || 'You do not have access.';
  }

  if (err.name === 'NotFound') {
    status = 404;
    message = err.message || 'Data not found.';
  }

  if (err.name === 'ServiceUnavailable') {
    status = 503;
    message = err.message || 'Service temporarily unavailable.';
  }

  res.status(status).json({ message });
}

module.exports = { errorHandler };
