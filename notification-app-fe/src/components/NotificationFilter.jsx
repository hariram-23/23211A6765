import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { log } from "../utils/logger";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  const handleChange = (_, newValue) => {
    if (!newValue) return; // keep at least one selected
    log("frontend", "info", "filter", `Filter changed to: ${newValue}`);
    onChange(newValue);
  };

  return (
    <ToggleButtonGroup
      value={value || "All"}
      exclusive
      onChange={handleChange}
      size="small"
      sx={{ flexWrap: "wrap", gap: 0.5 }}
    >
      {filters.map((type) => (
        <ToggleButton key={type} value={type} sx={{ textTransform: "none", px: 2 }}>
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
