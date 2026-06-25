const axios = require("axios");

const EVAL_BASE_URL = process.env.EVAL_BASE_URL || "http://4.224.186.213/evaluation-service";
const TOKEN = process.env.TOKEN || "";

/**
 * log(stack, level, package, message)
 *
 * stack   : "frontend" | "backend"
 * level   : "info" | "error" | "warn" | "debug"
 * pkg     : module/package name string
 * message : human-readable message string
 */
async function log(stack, level, pkg, message) {
  try {
    await axios.post(
      `${EVAL_BASE_URL}/logs`,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (_) {
    // Never let logging break the application
  }
}

module.exports = { log };
