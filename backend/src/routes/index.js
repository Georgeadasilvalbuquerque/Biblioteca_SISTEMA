const { Router } = require("express");

const authRoutes = require("./auth.routes");
const usersRoutes = require("./users.routes");
const membersRoutes = require("./members.routes");
const itemsRoutes = require("./items.routes");
const movementsRoutes = require("./movements.routes");
const loansRoutes = require("./loans.routes");
const dashboardRoutes = require("./dashboard.routes");
const settingsRoutes = require("./settings.routes");

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/members", membersRoutes);
router.use("/items", itemsRoutes);
router.use("/movements", movementsRoutes);
router.use("/loans", loansRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
