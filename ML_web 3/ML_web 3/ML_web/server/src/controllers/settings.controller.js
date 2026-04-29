const { Setting } = require("../db/models");

// Default values – used when no DB row exists
const DEFAULTS = {
  // AI Models
  sentimentEndpoint: "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
  sentimentThreshold: "0.7",
  sentimentBatchSize: "20",
  summaryEndpoint: "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
  summaryMaxLength: "256",
  summaryLanguage: "en",
  apiToken: "",
  mlServiceUrl: "http://ml-service:8000",
  autoBatch: "true",
  batchInterval: "30",

  // Integrations
  slackEnabled: "false", slackWebhookUrl: "", slackChannel: "#customer-support",
  emailEnabled: "false", smtpHost: "", smtpPort: "587", smtpUser: "", smtpPassword: "",
  webhooksEnabled: "false", webhookUrl: "", webhookSecret: "",
  crmEnabled: "false", crmApiUrl: "", crmApiKey: "",

  // Notifications
  minCsatAlert: "70",
  minSentimentAlert: "0.3",
  maxResponseTimeAlert: "10",
  maxQueueAlert: "20",
  notifyEmail: "true",
  notifySlack: "false",
  notifyInApp: "true",
  notifySound: "false",
  eventLowCsat: "true",
  eventNegativeSentiment: "true",
  eventLongWait: "true",
  eventNewConversation: "false",
  eventSystemDown: "true",
  dailyDigest: "true",
  digestTime: "18:00",
  digestRecipients: "",

  // Security
  jwtSecret: "change_this_secret",
  tokenExpiry: "24",
  refreshTokenExpiry: "7",
  passwordMinLength: "6",
  maxFailedAttempts: "5",
  requireUppercase: "false",
  requireNumber: "false",
  requireSpecialChar: "false",
  singleSession: "false",
  autoLogout: "true",
  inactivityTimeout: "30",
  agentCanViewAllChats: "false",
  agentCanExportData: "false",
  agentCanViewAnalytics: "false",
  rateLimitMax: "500",
  rateLimitWindow: "15",
  corsRestrict: "false",
  corsOrigins: "",
};

const CATEGORIES = {
  sentimentEndpoint: "llm", sentimentThreshold: "llm", sentimentBatchSize: "llm",
  summaryEndpoint: "llm", summaryMaxLength: "llm", summaryLanguage: "llm",
  apiToken: "llm", mlServiceUrl: "llm", autoBatch: "llm", batchInterval: "llm",

  slackEnabled: "integrations", slackWebhookUrl: "integrations", slackChannel: "integrations",
  emailEnabled: "integrations", smtpHost: "integrations", smtpPort: "integrations",
  smtpUser: "integrations", smtpPassword: "integrations",
  webhooksEnabled: "integrations", webhookUrl: "integrations", webhookSecret: "integrations",
  crmEnabled: "integrations", crmApiUrl: "integrations", crmApiKey: "integrations",

  minCsatAlert: "notifications", minSentimentAlert: "notifications",
  maxResponseTimeAlert: "notifications", maxQueueAlert: "notifications",
  notifyEmail: "notifications", notifySlack: "notifications",
  notifyInApp: "notifications", notifySound: "notifications",
  eventLowCsat: "notifications", eventNegativeSentiment: "notifications",
  eventLongWait: "notifications", eventNewConversation: "notifications",
  eventSystemDown: "notifications",
  dailyDigest: "notifications", digestTime: "notifications", digestRecipients: "notifications",

  jwtSecret: "security", tokenExpiry: "security", refreshTokenExpiry: "security",
  passwordMinLength: "security", maxFailedAttempts: "security",
  requireUppercase: "security", requireNumber: "security", requireSpecialChar: "security",
  singleSession: "security", autoLogout: "security", inactivityTimeout: "security",
  agentCanViewAllChats: "security", agentCanExportData: "security", agentCanViewAnalytics: "security",
  rateLimitMax: "security", rateLimitWindow: "security",
  corsRestrict: "security", corsOrigins: "security",
};

// Keys that should always remain as strings (not parsed to numbers)
const STRING_KEYS = new Set([
  "sentimentEndpoint", "summaryEndpoint", "apiToken", "mlServiceUrl", "summaryLanguage",
  "slackWebhookUrl", "slackChannel", "smtpHost", "smtpUser", "smtpPassword",
  "webhookUrl", "webhookSecret", "crmApiUrl", "crmApiKey",
  "digestTime", "digestRecipients",
  "jwtSecret", "corsOrigins",
]);

// Parse stored string values back to proper types
function parseValue(key, raw) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (STRING_KEYS.has(key)) return raw;
  const asNum = Number(raw);
  if (!isNaN(asNum) && raw !== "") return asNum;
  return raw;
}

/**
 * GET /api/settings
 * Optional query: ?category=llm
 */
async function getSettings(req, res) {
  try {
    const where = {};
    if (req.query.category) {
      where.category = req.query.category;
    }

    const rows = await Setting.findAll({ where });
    const stored = {};
    for (const row of rows) {
      stored[row.key] = row.value;
    }

    // Merge defaults with stored values
    const relevantDefaults = req.query.category
      ? Object.fromEntries(Object.entries(DEFAULTS).filter(([k]) => CATEGORIES[k] === req.query.category))
      : DEFAULTS;

    const merged = {};
    for (const [key, defaultVal] of Object.entries(relevantDefaults)) {
      const raw = stored[key] !== undefined ? stored[key] : defaultVal;
      merged[key] = parseValue(key, raw);
    }

    res.json(merged);
  } catch (error) {
    console.error("Failed to get settings:", error);
    res.status(500).json({ message: "Failed to load settings" });
  }
}

/**
 * PUT /api/settings
 * Body: { key1: value1, key2: value2, ... }
 */
async function updateSettings(req, res) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ message: "Request body must be an object of key-value pairs" });
    }

    const validKeys = Object.keys(DEFAULTS);
    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue;

      const strValue = String(value);
      const category = CATEGORIES[key] || "general";

      const [setting, created] = await Setting.findOrCreate({
        where: { key },
        defaults: { value: strValue, category },
      });

      if (!created) {
        setting.value = strValue;
        await setting.save();
      }
      results.push({ key, value: parseValue(key, strValue) });
    }

    res.json({ message: "Settings saved successfully", updated: results.length });
  } catch (error) {
    console.error("Failed to update settings:", error);
    res.status(500).json({ message: "Failed to save settings" });
  }
}

/**
 * DELETE /api/settings
 * Resets all settings to default
 */
async function resetSettings(req, res) {
  try {
    await Setting.destroy({ where: {} });

    const merged = {};
    for (const [key, val] of Object.entries(DEFAULTS)) {
      merged[key] = parseValue(key, val);
    }

    res.json({ message: "All settings reset to defaults", settings: merged });
  } catch (error) {
    console.error("Failed to reset settings:", error);
    res.status(500).json({ message: "Failed to reset settings" });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
};
