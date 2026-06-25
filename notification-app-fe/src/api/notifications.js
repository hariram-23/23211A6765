import axios from "axios";
import { log } from "../utils/logger";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Fetch notifications from the backend.
 * @param {object} params - { page, limit, notification_type }
 */
export async function fetchNotifications({ page = 1, limit = 10, notification_type = "" } = {}) {
  log("frontend", "info", "api", `Fetching notifications page=${page} type=${notification_type}`);

  try {
    const params = { page, limit };
    if (notification_type && notification_type !== "All") {
      params.notification_type = notification_type.toLowerCase();
    }

    const res = await axios.get(`${BASE_URL}/notifications`, { params });

    log("frontend", "info", "api", `Received ${res.data.notifications?.length ?? 0} notifications`);
    return res.data;
  } catch (err) {
    log("frontend", "error", "api", `Failed to fetch notifications: ${err.message}`);
    throw err;
  }
}
