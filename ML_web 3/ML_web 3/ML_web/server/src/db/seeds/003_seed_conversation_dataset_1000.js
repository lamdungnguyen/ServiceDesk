const {
  Employee,
  Customer,
  Game,
  Conversation,
  Message,
  AnalysisResult,
  PerformanceScore,
  Prediction
} = require("../models");

const DATASET_SIZE = 1000;
const RNG_SEED = 20260319;

const AGENT_PROFILES = [
  { name: "Ava Brooks", team: "Global Care" },
  { name: "Noah Reed", team: "Global Care" },
  { name: "Mia Parker", team: "Global Care" },
  { name: "Ethan Cole", team: "Global Care" },
  { name: "Grace Turner", team: "Escalations" },
  { name: "Lucas Green", team: "Escalations" },
  { name: "Olivia Hayes", team: "VIP Care" },
  { name: "Daniel Scott", team: "VIP Care" }
];

const ISSUE_LIBRARY = [
  {
    topic: "login issue",
    customerOpening: [
      "I cannot log in even after resetting my password.",
      "Your launcher keeps saying invalid credentials.",
      "My account login fails on both PC and mobile."
    ],
    customerFollowUp: [
      "I already cleared cache and retried.",
      "This started after yesterday's update.",
      "I need help quickly because my event is live now."
    ],
    agentAction: [
      "I verified your account and refreshed your auth token.",
      "I found a login lock and removed it from your profile.",
      "I enabled a secure sign-in bypass while we sync your data."
    ],
    agentResolution: [
      "Please restart the client and sign in again now.",
      "The account is active again. Try logging in once more.",
      "You should now be able to enter the game without any error."
    ],
    sentimentBias: 0.58
  },
  {
    topic: "payment problem",
    customerOpening: [
      "My card was charged but I did not receive the item.",
      "The top-up failed but the money left my bank account.",
      "I paid for a bundle and it still shows pending."
    ],
    customerFollowUp: [
      "Can you confirm when this will be fixed?",
      "I can share the transaction ID if needed.",
      "I have been waiting for several hours already."
    ],
    agentAction: [
      "I located the payment transaction in our billing system.",
      "I escalated your payment case to finance with high priority.",
      "I manually re-synced the purchase record on your account."
    ],
    agentResolution: [
      "Your items are delivered now and the receipt has been updated.",
      "The payment was confirmed and the missing bundle is now visible.",
      "The transaction has been fixed and no extra charge remains."
    ],
    sentimentBias: 0.52
  },
  {
    topic: "bug report",
    customerOpening: [
      "The game crashes every time I enter ranked mode.",
      "I found a bug where the quest progress resets.",
      "The app freezes after the loading screen."
    ],
    customerFollowUp: [
      "I already reinstalled but the bug is still there.",
      "This is happening to my teammates too.",
      "It only started after the latest patch."
    ],
    agentAction: [
      "I collected your logs and forwarded them to engineering.",
      "I applied the temporary workaround to your account.",
      "I matched your report with an active bug ticket."
    ],
    agentResolution: [
      "A hotfix is now applied and your mode should run normally.",
      "Please test again after this session update, it should be stable.",
      "The workaround is active now and you can continue playing."
    ],
    sentimentBias: 0.46
  },
  {
    topic: "delivery delay",
    customerOpening: [
      "My support request has been pending for too long.",
      "I was promised a callback but nobody contacted me.",
      "The ticket status has not changed for two days."
    ],
    customerFollowUp: [
      "I need a clear ETA, not another generic response.",
      "Please do not close the ticket before resolution.",
      "This delay is affecting my gameplay schedule."
    ],
    agentAction: [
      "I reviewed your case timeline and confirmed the delay.",
      "I reassigned this ticket to the fast-response queue.",
      "I contacted the responsible team directly for immediate handling."
    ],
    agentResolution: [
      "Your case is now resolved and I sent the full update by email.",
      "The pending action has been completed and confirmed.",
      "Everything is completed now and your request is closed."
    ],
    sentimentBias: 0.44
  },
  {
    topic: "account recovery",
    customerOpening: [
      "I lost access to my old email and cannot verify my account.",
      "Someone changed my account details without permission.",
      "I need to recover my account after device loss."
    ],
    customerFollowUp: [
      "I can provide my purchase history for verification.",
      "Please lock the account if suspicious activity continues.",
      "I need this solved before my ranked deadline."
    ],
    agentAction: [
      "I validated ownership based on your historical account data.",
      "I added extra protection and reset your recovery options.",
      "I locked suspicious sessions and secured your profile."
    ],
    agentResolution: [
      "Recovery is complete and your account is now protected.",
      "You can now sign in with your new verified email.",
      "Access has been restored and all unauthorized sessions were removed."
    ],
    sentimentBias: 0.6
  },
  {
    topic: "latency complaint",
    customerOpening: [
      "My ping is very high only in your game servers.",
      "The match keeps lagging and I cannot play properly.",
      "I get random spikes every few minutes."
    ],
    customerFollowUp: [
      "Other online games are working fine on my network.",
      "Can you check if this is a regional routing issue?",
      "This problem is ruining ranked matches for me."
    ],
    agentAction: [
      "I ran a route check and confirmed packet loss on one node.",
      "I switched your connection profile to the optimal region.",
      "I submitted your route trace to our network team."
    ],
    agentResolution: [
      "Your route has been optimized and latency should now be stable.",
      "The network adjustment is active; please test one new match.",
      "We rerouted your traffic and the spike issue should be reduced."
    ],
    sentimentBias: 0.48
  }
];

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toOneDecimal(value) {
  return Number(value.toFixed(1));
}

function toTwoDecimal(value) {
  return Number(value.toFixed(2));
}

function sentimentLabel(score01) {
  if (score01 >= 0.6) {
    return "positive";
  }
  if (score01 <= 0.4) {
    return "negative";
  }
  return "neutral";
}

function buildMessages(issue, gameName, random, startedAt) {
  const customerOpen = pick(issue.customerOpening, random);
  const customerFollowUp = pick(issue.customerFollowUp, random);
  const agentAction = pick(issue.agentAction, random);
  const agentResolution = pick(issue.agentResolution, random);

  const timeline = [
    {
      senderType: "customer",
      text: `${customerOpen} (Game: ${gameName})`,
      sentAt: new Date(startedAt.getTime()),
      responseTimeSec: null
    },
    {
      senderType: "employee",
      text: `${agentAction}`,
      sentAt: new Date(startedAt.getTime() + 60 * 1000),
      responseTimeSec: toOneDecimal(20 + random() * 100)
    },
    {
      senderType: "customer",
      text: `${customerFollowUp}`,
      sentAt: new Date(startedAt.getTime() + 3 * 60 * 1000),
      responseTimeSec: null
    },
    {
      senderType: "employee",
      text: `${agentResolution}`,
      sentAt: new Date(startedAt.getTime() + 5 * 60 * 1000),
      responseTimeSec: toOneDecimal(25 + random() * 120)
    }
  ];

  if (random() > 0.35) {
    timeline.push({
      senderType: "customer",
      text: "Thanks, that solves my problem.",
      sentAt: new Date(startedAt.getTime() + 7 * 60 * 1000),
      responseTimeSec: null
    });
  }

  return timeline;
}

function buildConversationMetrics(issue, random) {
  const noise = (random() - 0.5) * 0.28;
  const sentimentScore = clamp(issue.sentimentBias + noise, 0.1, 0.95);
  const satisfaction = clamp(sentimentScore * 100 + (random() - 0.5) * 14, 35, 98);

  const communicationScore = clamp(62 + sentimentScore * 32 + (random() - 0.5) * 8, 55, 99);
  const empathyScore = clamp(60 + sentimentScore * 35 + (random() - 0.5) * 10, 52, 99);
  const resolutionScore = clamp(58 + sentimentScore * 34 + (random() - 0.5) * 12, 50, 99);
  const kpiScore = clamp((communicationScore + empathyScore + resolutionScore) / 3 + (random() - 0.5) * 6, 52, 99);

  const predictedEffectiveness = clamp(
    0.42 * kpiScore + 0.22 * communicationScore + 0.18 * resolutionScore + 0.18 * empathyScore,
    45,
    99
  );

  const riskLevel = predictedEffectiveness < 65 ? "high" : predictedEffectiveness < 80 ? "medium" : "low";

  return {
    analysis: {
      sentimentScore: toTwoDecimal(sentimentScore),
      sentimentLabel: sentimentLabel(sentimentScore),
      customerSatisfaction: toTwoDecimal(satisfaction)
    },
    performance: {
      kpiScore: toTwoDecimal(kpiScore),
      communicationScore: toTwoDecimal(communicationScore),
      empathyScore: toTwoDecimal(empathyScore),
      resolutionScore: toTwoDecimal(resolutionScore)
    },
    prediction: {
      period: "weekly",
      predictedEffectiveness: toTwoDecimal(predictedEffectiveness),
      riskLevel,
      factors: [
        { name: "kpiScore", impact: 0.42 },
        { name: "communicationScore", impact: 0.22 },
        { name: "resolutionScore", impact: 0.18 },
        { name: "empathyScore", impact: 0.18 }
      ]
    }
  };
}

async function ensureAgents() {
  const agents = [];

  for (const profile of AGENT_PROFILES) {
    const [employee] = await Employee.findOrCreate({
      where: { name: profile.name },
      defaults: {
        name: profile.name,
        team: profile.team,
        role: "customer_care_agent",
        status: "Active",
        supportsAllGames: true,
        allowedGameIds: null,
        email: `${profile.name.toLowerCase().replace(/\s+/g, ".")}@ml-web.local`,
        password: "123456"
      }
    });

    agents.push(employee);
  }

  return agents;
}

async function ensureCustomers(total) {
  const customers = [];

  for (let i = 1; i <= total; i += 1) {
    const customer = await Customer.create({
      name: `Sample Customer ${String(i).padStart(4, "0")}`
    });
    customers.push(customer);
  }

  return customers;
}

async function up() {
  const existingCount = await Conversation.count();
  const missingCount = Math.max(0, DATASET_SIZE - existingCount);

  if (missingCount === 0) {
    return;
  }

  const random = createRng(RNG_SEED + existingCount);
  const agents = await ensureAgents();
  const customers = await ensureCustomers(Math.max(220, Math.ceil(missingCount / 3)));

  let games = await Game.findAll({ where: { status: "active" } });
  if (!games.length) {
    const [fallbackGame] = await Game.findOrCreate({
      where: { slug: "default-support-game" },
      defaults: {
        name: "Default Support Game",
        slug: "default-support-game",
        status: "active"
      }
    });
    games = [fallbackGame];
  }

  for (let index = 0; index < missingCount; index += 1) {
    const issue = pick(ISSUE_LIBRARY, random);
    const employee = pick(agents, random);
    const customer = customers[index % customers.length];
    const game = pick(games, random);

    const startedAt = new Date(Date.now() - (2 + Math.floor(random() * 120)) * 24 * 60 * 60 * 1000);
    const messages = buildMessages(issue, game.name, random, startedAt);
    const endedAt = messages[messages.length - 1].sentAt;

    const conversation = await Conversation.create({
      employee_id: employee.id,
      customer_id: customer.id,
      language: "en",
      status: "resolved",
      game_id: game.id,
      startedAt,
      endedAt
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

    const metrics = buildConversationMetrics(issue, random);

    const firstCustomerMessage = messages.find((item) => item.senderType === "customer")?.text || "Customer requested support.";
    const lastAgentMessage = messages
      .slice()
      .reverse()
      .find((item) => item.senderType === "employee")?.text || "Agent provided support.";

    await AnalysisResult.create({
      conversation_id: conversation.id,
      summary: `Customer request: ${firstCustomerMessage} Agent response: ${lastAgentMessage}`.slice(0, 600),
      sentimentScore: metrics.analysis.sentimentScore,
      sentimentLabel: metrics.analysis.sentimentLabel,
      customerSatisfaction: metrics.analysis.customerSatisfaction
    });

    await PerformanceScore.create({
      employee_id: employee.id,
      conversation_id: conversation.id,
      kpiScore: metrics.performance.kpiScore,
      communicationScore: metrics.performance.communicationScore,
      empathyScore: metrics.performance.empathyScore,
      resolutionScore: metrics.performance.resolutionScore
    });

    await Prediction.create({
      employee_id: employee.id,
      period: metrics.prediction.period,
      predictedEffectiveness: metrics.prediction.predictedEffectiveness,
      riskLevel: metrics.prediction.riskLevel,
      factors: metrics.prediction.factors
    });
  }
}

module.exports = {
  name: "003_seed_conversation_dataset_1000",
  up
};
