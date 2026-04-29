const {
  Employee,
  Conversation,
  Message,
  Customer,
  AnalysisResult,
  PerformanceScore,
  Prediction
} = require("../db/models");

function normalizeDistribution(keys) {
  const map = new Map();
  keys.forEach((key) => {
    map.set(key, (map.get(key) || 0) + 1);
  });

  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

async function getDashboardStats({ language = "all", employeeId = "all", team = "all" } = {}) {
  const where = {};
  if (language !== "all") {
    where.language = language;
  }
  if (employeeId !== "all") {
    where.employee_id = Number(employeeId);
  }

  const conversations = await Conversation.findAll({
    where,
    include: [
      {
        model: Employee,
        attributes: ["id", "name", "team"]
      },
      {
        model: Customer,
        attributes: ["name"]
      },
      {
        model: Message
      },
      {
        model: AnalysisResult
      },
      {
        model: PerformanceScore
      }
    ],
    order: [["createdAt", "DESC"]]
  });

  const filteredConversations = team === "all"
    ? conversations
    : conversations.filter((item) => item.employee?.team === team);

  const totalConversations = filteredConversations.length;
  const analyzedRows = filteredConversations.filter((item) => item.analysis_result);
  const analyzedConversations = analyzedRows.length;

  const employeeSet = new Set(
    filteredConversations.map((item) => item.employee?.id).filter(Boolean)
  );
  const employeeCount = employeeSet.size;

  const avgSatisfaction = analyzedRows.length
    ? analyzedRows.reduce((sum, item) => sum + item.analysis_result.customerSatisfaction, 0) / analyzedRows.length
    : 0;

  const allScores = filteredConversations.flatMap((item) => item.performance_scores || []);

  const groupedByEmployee = new Map();

  allScores.forEach((item) => {
    const key = item.employee_id;
    if (!groupedByEmployee.has(key)) {
      groupedByEmployee.set(key, {
        employee: filteredConversations.find((conversation) => conversation.employee?.id === key)?.employee,
        sumKpi: 0,
        count: 0
      });
    }

    const current = groupedByEmployee.get(key);
    current.sumKpi += item.kpiScore;
    current.count += 1;
  });

  const topPerformers = [...groupedByEmployee.entries()]
    .map(([employeeId, value]) => ({
      employee_id: employeeId,
      employee: value.employee,
      dataValues: {
        avgKpi: value.count ? value.sumKpi / value.count : 0
      }
    }))
    .sort((a, b) => b.dataValues.avgKpi - a.dataValues.avgKpi)
    .slice(0, 5);

  const employeeIds = [...employeeSet];
  const predictionWhere = {};
  if (employeeId !== "all") {
    predictionWhere.employee_id = Number(employeeId);
  } else if (team !== "all") {
    predictionWhere.employee_id = employeeIds.length ? employeeIds : [-1];
  }

  const latestPredictions = await Prediction.findAll({
    where: predictionWhere,
    include: [{ model: Employee, attributes: ["name", "team"] }],
    order: [["createdAt", "DESC"]],
    limit: 10
  });

  const sentimentDistribution = normalizeDistribution(
    analyzedRows.map((item) => item.analysis_result.sentimentLabel)
  );

  const languageDistribution = normalizeDistribution(
    filteredConversations.map((item) => item.language || "unknown")
  );

  const analysisFeed = analyzedRows.slice(0, 20).map((item) => ({
    conversationId: item.id,
    employeeName: item.employee?.name,
    customerName: item.customer?.name,
    language: item.language,
    summary: item.analysis_result.summary,
    sentimentLabel: item.analysis_result.sentimentLabel,
    sentimentScore: item.analysis_result.sentimentScore,
    customerSatisfaction: item.analysis_result.customerSatisfaction,
    latestKpi: item.performance_scores?.length
      ? item.performance_scores[item.performance_scores.length - 1].kpiScore
      : null,
    createdAt: item.createdAt
  }));

  const teams = [...new Set(conversations.map((item) => item.employee?.team).filter(Boolean))];
  const employees = [...new Set(conversations.map((item) => item.employee?.id))]
    .filter(Boolean)
    .map((id) => {
      const employee = conversations.find((item) => item.employee?.id === id)?.employee;
      return {
        id: employee.id,
        name: employee.name,
        team: employee.team
      };
    });

  return {
    filters: {
      language,
      employeeId,
      team
    },
    options: {
      teams,
      employees
    },
    totals: {
      totalConversations,
      analyzedConversations,
      employeeCount,
      avgSatisfaction: Number(avgSatisfaction || 0)
    },
    sentimentDistribution,
    languageDistribution,
    analysisFeed,
    topPerformers,
    latestPredictions
  };
}

async function getEmployeeHistory(employeeId) {
  const [scores, predictions] = await Promise.all([
    PerformanceScore.findAll({
      where: { employee_id: employeeId },
      order: [["createdAt", "ASC"]]
    }),
    Prediction.findAll({
      where: { employee_id: employeeId },
      order: [["createdAt", "ASC"]]
    })
  ]);

  return {
    scores,
    predictions
  };
}

module.exports = {
  getDashboardStats,
  getEmployeeHistory
};
