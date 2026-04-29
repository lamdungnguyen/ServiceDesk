const axios = require("axios");
const env = require("../config/env");

const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 15000
});

function localFallbackAnalysis(messages) {
  const safeMessages = Array.isArray(messages)
    ? messages.filter((item) => item && typeof item.text === "string" && item.text.trim().length)
    : [];

  const normalizedText = safeMessages
    .map((item) => item.text.toLowerCase().replace(/\s+/g, " ").trim())
    .join(" ");

  const positiveHints = [
    "thank",
    "thanks",
    "resolved",
    "helpful",
    "works now",
    "great",
    "excellent",
    "perfect",
    "appreciate"
  ];
  const negativeHints = [
    "angry",
    "frustrated",
    "doesn't work",
    "not working",
    "still broken",
    "delay",
    "slow",
    "error",
    "issue persists",
    "unacceptable"
  ];

  const positive = positiveHints.filter((token) => normalizedText.includes(token)).length;
  const negative = negativeHints.filter((token) => normalizedText.includes(token)).length;

  const score = Math.max(-1, Math.min(1, (positive - negative) / 5));
  const label = score >= 0.2 ? "positive" : score <= -0.2 ? "negative" : "neutral";

  const customerMessages = safeMessages
    .filter((item) => (item.senderRole || "").toLowerCase() !== "agent")
    .map((item) => item.text.trim());
  const agentMessages = safeMessages
    .filter((item) => (item.senderRole || "").toLowerCase() === "agent")
    .map((item) => item.text.trim());

  const latestCustomerIssue = customerMessages.at(-1) || customerMessages.at(0) || "The customer requested support.";
  const latestAgentAction = agentMessages.at(-1) || "The agent provided guidance and attempted resolution.";

  const summary = [
    `Customer request: ${latestCustomerIssue}`,
    `Agent response: ${latestAgentAction}`,
    `Overall sentiment appears ${label}.`
  ]
    .join(" ")
    .slice(0, 500);

  return {
    summary,
    sentimentScore: Number(((score + 1) / 2).toFixed(3)),
    sentimentLabel: label
  };
}

async function analyzeConversation(messages, language) {
  try {
    const response = await client.post("/analyze", { messages, language });
    return response.data;
  } catch (_error) {
    return localFallbackAnalysis(messages);
  }
}

async function predictEmployee(payload) {
  try {
    const response = await client.post("/predict/employee", payload);
    return response.data;
  } catch (_error) {
    const periodMultiplier = payload.period === "quarterly" ? 0.9 : payload.period === "monthly" ? 0.95 : 1;
    const baseline = Number(
      (
        (payload.kpiScore * 0.5 + payload.sentimentScore * 100 * 0.2 + payload.resolutionScore * 0.15 + payload.communicationScore * 0.15) *
        periodMultiplier
      ).toFixed(2)
    );

    const total = Math.max(1, payload.kpiScore + payload.sentimentScore * 100 + payload.resolutionScore + payload.communicationScore);

    return {
      predictedEffectiveness: Math.max(0, Math.min(100, baseline)),
      riskLevel: baseline < 55 ? "high" : baseline < 75 ? "medium" : "low",
      factors: [
        {
          name: "kpiScore",
          impact: Number((payload.kpiScore / total).toFixed(2))
        },
        {
          name: "sentimentScore",
          impact: Number(((payload.sentimentScore * 100) / total).toFixed(2))
        },
        {
          name: "resolutionScore",
          impact: Number((payload.resolutionScore / total).toFixed(2))
        },
        {
          name: "communicationScore",
          impact: Number((payload.communicationScore / total).toFixed(2))
        }
      ]
    };
  }
}

module.exports = {
  analyzeConversation,
  predictEmployee
};
