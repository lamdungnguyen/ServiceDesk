const { clampScore, average } = require("../utils/score");

function computeCommunicationScore(messages) {
  const employeeMessages = messages.filter((item) => item.senderType === "employee");
  const avgLength = average(employeeMessages.map((item) => item.text.length));
  const coverage = Math.min(employeeMessages.length * 10, 40);
  return clampScore(coverage + Math.min(avgLength / 2, 60));
}

function computeEmpathyScore(messages, sentimentScore) {
  const empathyKeywords = ["apologize", "thanks", "understand", "sorry", "please", "support"];
  const text = messages.map((item) => item.text.toLowerCase()).join(" ");
  const empathyHits = empathyKeywords.filter((token) => text.includes(token)).length;

  return clampScore(sentimentScore * 50 + empathyHits * 8);
}

function computeResolutionScore(messages) {
  const responseTimes = messages
    .filter((item) => item.senderType === "employee" && item.responseTimeSec !== null)
    .map((item) => item.responseTimeSec);

  const avgResponse = average(responseTimes);
  if (!avgResponse) {
    return 60;
  }

  if (avgResponse <= 60) {
    return 95;
  }

  if (avgResponse <= 180) {
    return 80;
  }

  if (avgResponse <= 600) {
    return 65;
  }

  return 45;
}

function computeKpi(scores) {
  return clampScore(scores.communicationScore * 0.35 + scores.empathyScore * 0.25 + scores.resolutionScore * 0.4);
}

function deriveSatisfaction(sentimentScore) {
  return clampScore(sentimentScore * 100);
}

function evaluatePerformance(messages, sentimentScore) {
  const communicationScore = computeCommunicationScore(messages);
  const empathyScore = computeEmpathyScore(messages, sentimentScore);
  const resolutionScore = computeResolutionScore(messages);

  const kpiScore = computeKpi({
    communicationScore,
    empathyScore,
    resolutionScore
  });

  return {
    communicationScore,
    empathyScore,
    resolutionScore,
    kpiScore,
    customerSatisfaction: deriveSatisfaction(sentimentScore)
  };
}

function calculateTrend(scores = []) {
  if (scores.length < 2) {
    return {
      direction: "stable",
      delta: 0
    };
  }

  const latest = scores[scores.length - 1].kpiScore;
  const previous = scores[scores.length - 2].kpiScore;
  const delta = Number((latest - previous).toFixed(2));

  if (delta > 2) {
    return { direction: "up", delta };
  }

  if (delta < -2) {
    return { direction: "down", delta };
  }

  return { direction: "stable", delta };
}

function deriveAlertLevel({ latestKpi = 0, trendDirection = "stable", latestRisk = "medium" }) {
  if (latestKpi < 55 || latestRisk === "high" || trendDirection === "down") {
    return "critical";
  }

  if (latestKpi < 75 || latestRisk === "medium") {
    return "warning";
  }

  return "good";
}

function buildRecommendations(latestScore, latestPrediction, trend) {
  const items = [];

  if (!latestScore) {
    return ["Need more conversation data to provide accurate recommendations."];
  }

  if (latestScore.resolutionScore < 70) {
    items.push("Prioritize reducing average response time to under 3 minutes.");
  }

  if (latestScore.empathyScore < 70) {
    items.push("Increase frequency of apologies/thanks and confirm customer issues.");
  }

  if (latestScore.communicationScore < 70) {
    items.push("Optimize response structure: clear, concise, actionable steps.");
  }

  if (trend.direction === "down") {
    items.push("Warning: performance is dropping. Suggest 1:1 review and coaching this week.");
  }

  if (latestPrediction?.riskLevel === "high") {
    items.push("Assign employee to tickets with moderate complexity for 1-2 weeks to stabilize KPI.");
  }

  if (!items.length) {
    items.push("Stable performance, continue maintaining current SLA and expand weekly quality reviews.");
  }

  return items;
}

function summarizeEmployeePerformance(scores = [], predictions = []) {
  const latestScore = scores[scores.length - 1] || null;
  const latestPrediction = predictions[predictions.length - 1] || null;
  const trend = calculateTrend(scores);

  const latestKpi = latestScore ? Number(latestScore.kpiScore || 0) : 0;
  const alertLevel = deriveAlertLevel({
    latestKpi,
    trendDirection: trend.direction,
    latestRisk: latestPrediction?.riskLevel || "medium"
  });

  return {
    latestKpi,
    trend,
    latestRisk: latestPrediction?.riskLevel || "unknown",
    latestPredictedEffectiveness: latestPrediction
      ? Number(latestPrediction.predictedEffectiveness || 0)
      : null,
    alertLevel,
    recommendations: buildRecommendations(latestScore, latestPrediction, trend)
  };
}

module.exports = {
  evaluatePerformance,
  summarizeEmployeePerformance
};
