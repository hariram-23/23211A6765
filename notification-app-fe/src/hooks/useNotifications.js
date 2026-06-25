import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../api/notifications";
import { log } from "../utils/logger";

export function useNotifications({ page = 1, limit = 10, notification_type = "" } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    log("frontend", "info", "hook", `Loading notifications page=${page} type=${notification_type}`);

    try {
      const data = await fetchNotifications({ page, limit, notification_type });
      setNotifications(data.notifications ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      log("frontend", "error", "hook", `Error loading notifications: ${err.message}`);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page, limit, notification_type]);

  useEffect(() => {
    load();
  }, [load]);

  return { notifications, total, totalPages, loading, error };
}
