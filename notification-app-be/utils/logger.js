const axios = require("axios");
require("dotenv").config();

/**
 * Log an event to the AffordMed evaluation server.
 * @param {"frontend"|"backend"} stack
 * @param {"info"|"error"|"warn"|"debug"} level
 * @param {string} pkg  - package/module name (e.g. "api", "db", "auth")
 * @param {string} message
 */
async function log(stack, level, pkg, message) {
  try {
    await axios.post(
      `${process.env.EVAL_BASE_URL}/logs`,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    // Silently ignore – never break the app because of logging
  }
}

module.exports = { log };
