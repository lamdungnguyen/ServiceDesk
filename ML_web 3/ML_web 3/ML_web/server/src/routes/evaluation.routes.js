const express = require("express");
const {
  analyzeSingleConversation,
  analyzePendingConversations,
  runEmployeePrediction,
  forecastScenario,
  dashboardReport,
  employeeHistory
} = require("../controllers/evaluation.controller");

const router = express.Router();

router.get("/report", dashboardReport);
router.get("/employee/:employeeId/history", employeeHistory);
router.post("/conversation/:conversationId", analyzeSingleConversation);
router.post("/analyze-batch", analyzePendingConversations);
router.post("/employee/:employeeId/predict", runEmployeePrediction);
router.post("/employee/:employeeId/forecast-scenario", forecastScenario);

module.exports = router;
