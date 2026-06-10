/**
 * Standardized API response wrapper.
 * Ensures all successful responses follow a consistent shape:
 * { statuscode, data, message, success }
 */
class api_response {
  constructor(statuscode, data, message = 'success') {
    this.statuscode = statuscode;
    this.data = data;
    this.message = message;
    this.success = statuscode < 400;
  }
}

export { api_response };