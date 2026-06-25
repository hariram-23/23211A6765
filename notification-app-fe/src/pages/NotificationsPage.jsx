import { useState, useEffect } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { log } from "../utils/logger";

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const { notifications, total, totalPages, loading, error } = useNotifications({
    page,
    limit: 10,
    notification_type: filter,
  });

  // Log page load once
  useEffect(() => {
    log("frontend", "info", "page", "NotificationsPage loaded");
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleFilterChange = (newFilter) => {
    log("frontend", "info", "page", `Filter applied: ${newFilter}`);
    setFilter(newFilter);
    setPage(1); // reset to first page on filter change
  };

  const handlePageChange = (_, newPage) => {
    log("frontend", "info", "page", `Pagination: moved to page ${newPage}`);
    setPage(newPage);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 28 }} />
        </Badge>
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
        {total > 0 && (
          <Typography variant="body2" color="text.secondary">
            ({total} total)
          </Typography>
        )}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <NotificationFilter value={filter} onChange={handleFilterChange} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load notifications: {error}</Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">No notifications found.</Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={1.5}>
          {notifications.map((n) => (
            <NotificationCard key={n.notificationId || n._id} notification={n} />
          ))}
        </Stack>
      )}

      {!loading && totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
