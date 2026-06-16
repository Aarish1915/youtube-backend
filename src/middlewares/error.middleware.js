const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found. Invalid: ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  }

  if (err.statuscode) {
    statusCode = err.statuscode;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export { notFound, errorHandler };
