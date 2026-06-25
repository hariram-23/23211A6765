const axios = require("axios");
const { log } = require("../utils/logger");
require("dotenv").config();

/**
 * Priority map: lower number = higher priority
 */
const PRIORITY = { placement: 1, result: 2, event: 3 };

/**
 * GET /notifications
 * Query params: page, limit, notification_type
 */
async function getNotifications(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const notification_type = req.query.notification_type || "";

  log("backend", "info", "api", `Fetching notifications page=${page} limit=${limit} type=${notification_type}`);

  try {
    const params = { page, limit };
    if (notification_type && notification_type !== "All") {
      params.notification_type = notification_type.toLowerCase();
    }

    const response = await axios.get(
      `${process.env.EVAL_BASE_URL}/notifications`,
      {
        headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        params,
      }
    );

    const rawNotifications = response.data.notifications ?? response.data ?? [];
    const total = response.data.total ?? rawNotifications.length;

    // Stage 6: Priority sort (Placement > Result > Event), then newest first
    const sorted = [...rawNotifications].sort((a, b) => {
      const pa = PRIORITY[a.notification_type?.toLowerCase()] ?? 99;
      const pb = PRIORITY[b.notification_type?.toLowerCase()] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Top 10 per page after sorting
    const top10 = sorted.slice(0, 10);

    log("backend", "info", "api", `Returned ${top10.length} notifications`);

    res.json({
      notifications: top10,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    log("backend", "error", "api", `Failed to fetch notifications: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

module.exports = { getNotifications };
