const { log } = require("../utils/logger");

/**
 * Express middleware that logs every incoming request.
 */
function requestLogger(req, res, next) {
  log("backend", "info", "middleware", `${req.method} ${req.originalUrl}`);
  next();
}

module.exports = requestLogger;
