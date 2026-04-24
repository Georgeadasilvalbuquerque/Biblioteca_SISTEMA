const { Router } = require("express");
const { z } = require("zod");
const fs = require("node:fs/promises");
const path = require("node:path");

const asyncHandler = require("../utils/asyncHandler");
const validate = require("../middlewares/validate");
const { authenticate } = require("../middlewares/auth");

const router = Router();
const settingsPath = path.resolve(__dirname, "../data/settings.json");

const defaultSettings = {
  defaultLoanDays: 7,
  lowStockAlertThreshold: 1,
  allowNegativeAdjustments: false
};

const updateSchema = {
  body: z.object({
    defaultLoanDays: z.number().int().min(1).max(90),
    lowStockAlertThreshold: z.number().int().min(0).max(100),
    allowNegativeAdjustments: z.boolean()
  })
};

async function readSettings() {
  try {
    const raw = await fs.readFile(settingsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return defaultSettings;
  }
}

async function saveSettings(value) {
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(value, null, 2), "utf-8");
}

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await readSettings();
    res.json({ data: settings });
  })
);

router.put(
  "/",
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    await saveSettings(req.body);
    res.json({ data: req.body });
  })
);

module.exports = router;
