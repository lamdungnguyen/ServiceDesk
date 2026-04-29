const express = require("express");
const {
  getSettings,
  updateSettings,
  resetSettings,
} = require("../controllers/settings.controller");

const router = express.Router();

// GET /api/settings          – get all settings (or ?category=llm)
router.get("/", getSettings);

// PUT /api/settings          – upsert settings { key: value, ... }
router.put("/", updateSettings);

// DELETE /api/settings       – reset all to defaults
router.delete("/", resetSettings);

module.exports = router;
