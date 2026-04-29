const {
  Employee,
  Customer,
  Conversation,
  Message,
  AnalysisResult,
  PerformanceScore,
  Prediction
} = require("../models");

function buildMessages(texts, startTime) {
  return texts.map((item, index) => {
    const sentAt = new Date(startTime.getTime() + index * 90000);
    return {
      senderType: item.senderType,
      text: item.text,
      sentAt,
      responseTimeSec: item.responseTimeSec ?? null
    };
  });
}

async function createConversationBundle({ employee, customer, language, status, messages, analytics, score, prediction }) {
  const conversation = await Conversation.create({
    employee_id: employee.id,
    customer_id: customer.id,
    language,
    status,
    startedAt: messages[0].sentAt,
    endedAt: messages[messages.length - 1].sentAt
  });

  await Message.bulkCreate(
    messages.map((item) => ({
      conversation_id: conversation.id,
      senderType: item.senderType,
      text: item.text,
      sentAt: item.sentAt,
      responseTimeSec: item.responseTimeSec
    }))
  );

  await AnalysisResult.create({
    conversation_id: conversation.id,
    summary: analytics.summary,
    sentimentScore: analytics.sentimentScore,
    sentimentLabel: analytics.sentimentLabel,
    customerSatisfaction: analytics.customerSatisfaction
  });

  await PerformanceScore.create({
    employee_id: employee.id,
    conversation_id: conversation.id,
    kpiScore: score.kpiScore,
    communicationScore: score.communicationScore,
    empathyScore: score.empathyScore,
    resolutionScore: score.resolutionScore
  });

  await Prediction.create({
    employee_id: employee.id,
    period: prediction.period,
    predictedEffectiveness: prediction.predictedEffectiveness,
    riskLevel: prediction.riskLevel,
    factors: prediction.factors
  });
}

async function up() {
  const existingCount = await Conversation.count();
  if (existingCount > 0) {
    return;
  }

  const [linh] = await Employee.findOrCreate({
    where: { name: "Le Linh" },
    defaults: { team: "Vietnam Care" }
  });

  const [james] = await Employee.findOrCreate({
    where: { name: "James Carter" },
    defaults: { team: "Global Care" }
  });

  const [mai] = await Customer.findOrCreate({ where: { name: "Nguyen Mai" } });
  const [alex] = await Customer.findOrCreate({ where: { name: "Alex Brown" } });

  await createConversationBundle({
    employee: linh,
    customer: mai,
    language: "en",
    status: "resolved",
    messages: buildMessages(
      [
        { senderType: "customer", text: "Hello, my order is delayed by 2 days." },
        { senderType: "employee", text: "I apologize for the inconvenience. I will check for you right away.", responseTimeSec: 48 },
        { senderType: "customer", text: "Thanks, please update soon." },
        { senderType: "employee", text: "Updated, the order will arrive before 6 PM today.", responseTimeSec: 65 }
      ],
      new Date("2026-03-01T09:00:00Z")
    ),
    analytics: {
      summary: "Customer complained about slow delivery; employee apologized and provided a new delivery schedule today.",
      sentimentScore: 0.71,
      sentimentLabel: "positive",
      customerSatisfaction: 71
    },
    score: {
      kpiScore: 82,
      communicationScore: 85,
      empathyScore: 80,
      resolutionScore: 81
    },
    prediction: {
      period: "weekly",
      predictedEffectiveness: 84,
      riskLevel: "low",
      factors: [
        { name: "kpiScore", impact: 0.38 },
        { name: "sentimentScore", impact: 0.21 }
      ]
    }
  });

  await createConversationBundle({
    employee: james,
    customer: alex,
    language: "en",
    status: "resolved",
    messages: buildMessages(
      [
        { senderType: "customer", text: "Hi, my refund request has been pending for 5 days." },
        { senderType: "employee", text: "I am sorry for the delay. I will escalate this now.", responseTimeSec: 120 },
        { senderType: "customer", text: "Please confirm when it is processed." },
        { senderType: "employee", text: "Confirmed. You will receive the refund confirmation email in 2 hours.", responseTimeSec: 140 }
      ],
      new Date("2026-03-02T14:00:00Z")
    ),
    analytics: {
      summary: "Customer asked about delayed refund; agent apologized, escalated the ticket, and provided a clear ETA.",
      sentimentScore: 0.62,
      sentimentLabel: "positive",
      customerSatisfaction: 62
    },
    score: {
      kpiScore: 76,
      communicationScore: 74,
      empathyScore: 79,
      resolutionScore: 75
    },
    prediction: {
      period: "weekly",
      predictedEffectiveness: 77,
      riskLevel: "medium",
      factors: [
        { name: "kpiScore", impact: 0.34 },
        { name: "resolutionScore", impact: 0.18 }
      ]
    }
  });
}

module.exports = {
  name: "001_bilingual_sample_data",
  up
};
