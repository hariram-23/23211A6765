import axios from "axios";

const EVAL_BASE_URL = "http://4.224.186.213/evaluation-service";
const TOKEN = import.meta.env.VITE_TOKEN || "";

/**
 * log(stack, level, pkg, message)
 * Sends a log entry to the AffordMed evaluation server.
 */
export async function log(stack, level, pkg, message) {
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
    // Never break the UI because of logging
  }
}
