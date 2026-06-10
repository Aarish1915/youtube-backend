/**
 * Async handler utility — wraps async route handlers to catch
 * rejected promises and forward them to Express error middleware.
 * Eliminates the need for try-catch blocks in every controller.
 *
 * @param {Function} requestHandler - Express async route handler
 * @returns {Function} Express middleware with error forwarding
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };