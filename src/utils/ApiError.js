/**
 * Custom API error class for consistent error responses.
 * Extends native Error with HTTP status codes and structured error data.
 */
class api_error extends Error {
  constructor(
    statuscode,
    messages = 'something went wrong',
    errors = [],
    stack = ''
  ) {
    super(messages);
    this.statuscode = statuscode;
    this.data = null;
    this.message = messages;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { api_error };