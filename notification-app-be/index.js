const express = require("express");
const cors = require("cors");
require("dotenv").config();

const requestLogger = require("./middleware/requestLogger");
const notificationRoutes = require("./routes/notifications");
const { log } = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/notifications", notificationRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  log("backend", "info", "server", `Server started on port ${PORT}`);
});
