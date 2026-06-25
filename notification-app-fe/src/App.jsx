import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { NotificationsPage } from "./pages/NotificationsPage";

const theme = createTheme({
  palette: { mode: "light" },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationsPage />
    </ThemeProvider>
  );
}
