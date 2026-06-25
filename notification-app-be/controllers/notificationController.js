const axios = require("axios");
const { log } = require("../utils/logger");
require("dotenv").config();

/**
 * Priority map: lower number = higher priority
 */
const PRIORITY = { placement: 1, result: 2, event: 3 };

// Normalize AffordMed response fields to consistent shape
function normalize(n) {
  return {
    notificationId: n.ID || n.notificationId || n._id,
    title: n.Type || n.notification_type || n.title || "Notification",
    message: n.Message || n.message || "",
    notification_type: (n.Type || n.notification_type || "event").toLowerCase(),
    createdAt: n.Timestamp || n.createdAt,
    isRead: n.isRead ?? false,
  };
}

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
    // AffordMed max limit is 10, fetch all pages then filter+sort locally
    let allNotifications = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(
        `${process.env.EVAL_BASE_URL}/notifications`,
        {
          headers: { Authorization: `Bearer ${process.env.TOKEN}` },
          params: { page: currentPage, limit: 10 },
        }
      );

      const batch = response.data.notifications ?? [];
      allNotifications = allNotifications.concat(batch);

      const total = response.data.total ?? batch.length;
      const totalPages = Math.ceil(total / 10);
      if (currentPage >= totalPages || batch.length === 0) hasMore = false;
      else currentPage++;

      // Safety cap — don't fetch more than 5 pages
      if (currentPage > 5) hasMore = false;
    }

    // Normalize field names
    let normalized = allNotifications.map(normalize);

    // Filter by type if requested
    const typeFilter = notification_type && notification_type.toLowerCase() !== "all"
      ? notification_type.toLowerCase()
      : null;

    if (typeFilter) {
      normalized = normalized.filter(n => n.notification_type === typeFilter);
    }

    // Stage 6: Priority sort (Placement > Result > Event), then newest first
    const sorted = normalized.sort((a, b) => {
      const pa = PRIORITY[a.notification_type?.toLowerCase()] ?? 99;
      const pb = PRIORITY[b.notification_type?.toLowerCase()] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Paginate locally
    const total = sorted.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paged = sorted.slice(start, start + limit);

    log("backend", "info", "api", `Returned ${paged.length} notifications`);

    res.json({
      notifications: paged,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    log("backend", "error", "api", `Failed to fetch notifications: ${err.message}`);
    console.error("FETCH ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch notifications", detail: err.response?.data || err.message });
  }
}

module.exports = { getNotifications };
