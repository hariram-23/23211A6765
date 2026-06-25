import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";

const typeColors = {
  placement: "success",
  result: "warning",
  event: "info",
};

export function NotificationCard({ notification }) {
  const { title, message, notification_type, createdAt, isRead } = notification;
  const color = typeColors[notification_type?.toLowerCase()] || "default";

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: isRead ? 0.7 : 1,
        borderLeft: isRead ? "4px solid #ccc" : "4px solid #1976d2",
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="subtitle1" fontWeight={isRead ? 400 : 700}>
            {title}
          </Typography>
          <Chip
            label={notification_type || "unknown"}
            color={color}
            size="small"
            sx={{ textTransform: "capitalize" }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={1}>
          {message}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {createdAt ? new Date(createdAt).toLocaleString() : ""}
        </Typography>
      </CardContent>
    </Card>
  );
}
