const {
  Conversation,
  Message,
  AnalysisResult,
  PerformanceScore,
  Prediction,
  Employee,
  Customer
} = require("../db/models");
const { analyzeConversation, predictEmployee } = require("../services/mlClient.service");
const { evaluatePerformance, summarizeEmployeePerformance } = require("../services/evaluation.service");
const { getDashboardStats, getEmployeeHistory } = require("../services/report.service");

const PERIOD_WEIGHTS = {
  weekly: 1,
  monthly: 0.95,
  quarterly: 0.9
};

function safeScore(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

async function analyzeSingleConversation(req, res, next) {
  try {
    const conversation = await Conversation.findByPk(req.params.conversationId, {
      include: [
        { model: Employee, attributes: ["id", "name", "team"] },
        { model: Customer, attributes: ["id", "name"] },
        { model: Message }
      ]
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = conversation.messages.map((item) => ({
      senderType: item.senderType,
      text: item.text,
      responseTimeSec: item.responseTimeSec
    }));

    const analysis = await analyzeConversation(messages, conversation.language);
    const scores = evaluatePerformance(messages, analysis.sentimentScore);

    const [analysisResult] = await AnalysisResult.findOrCreate({
      where: { conversation_id: conversation.id },
      defaults: {
        conversation_id: conversation.id,
        summary: analysis.summary,
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        customerSatisfaction: scores.customerSatisfaction
      }
    });

    if (analysisResult.summary !== analysis.summary || analysisResult.sentimentScore !== analysis.sentimentScore) {
      analysisResult.summary = analysis.summary;
      analysisResult.sentimentScore = analysis.sentimentScore;
      analysisResult.sentimentLabel = analysis.sentimentLabel;
      analysisResult.customerSatisfaction = scores.customerSatisfaction;
      await analysisResult.save();
    }

    if (conversation.employee_id) {
      await PerformanceScore.create({
        employee_id: conversation.employee_id,
        conversation_id: conversation.id,
        kpiScore: scores.kpiScore,
        communicationScore: scores.communicationScore,
        empathyScore: scores.empathyScore,
        resolutionScore: scores.resolutionScore
      });
    }

    return res.json({
      conversationId: conversation.id,
      summary: analysis.summary,
      sentiment: {
        label: analysis.sentimentLabel,
        score: analysis.sentimentScore,
        customerSatisfaction: scores.customerSatisfaction
      },
      performance: scores
    });
  } catch (error) {
    return next(error);
  }
}

async function analyzePendingConversations(req, res, next) {
  try {
    const limit = Number(req.body?.limit || 20);
    const conversations = await Conversation.findAll({
      include: [{ model: AnalysisResult }],
      order: [["createdAt", "DESC"]],
      limit: Math.max(1, Math.min(limit, 100))
    });

    const pending = conversations.filter((item) => !item.analysis_result);
    const results = [];

    for (const conversation of pending) {
      try {
        const detailedConversation = await Conversation.findByPk(conversation.id, {
          include: [
            { model: Employee, attributes: ["id", "name", "team"] },
            { model: Customer, attributes: ["id", "name"] },
            { model: Message }
          ]
        });

        if (!detailedConversation || !detailedConversation.messages?.length) continue;

        const messages = detailedConversation.messages.map((item) => ({
          senderType: item.senderType,
          text: item.text,
          responseTimeSec: item.responseTimeSec
        }));

        if (messages.length < 2) continue;

        const analysis = await analyzeConversation(messages, detailedConversation.language);
        if (!analysis) continue;

        const scores = evaluatePerformance(messages, analysis.sentimentScore);

        await AnalysisResult.upsert({
          conversation_id: detailedConversation.id,
          summary: analysis.summary,
          sentimentScore: analysis.sentimentScore,
          sentimentLabel: analysis.sentimentLabel,
          customerSatisfaction: scores.customerSatisfaction
        });

        if (detailedConversation.employee_id) {
          await PerformanceScore.create({
            employee_id: detailedConversation.employee_id,
            conversation_id: detailedConversation.id,
            kpiScore: scores.kpiScore,
            communicationScore: scores.communicationScore,
            empathyScore: scores.empathyScore,
            resolutionScore: scores.resolutionScore
          });
        }

        results.push({
          conversationId: detailedConversation.id,
          sentimentLabel: analysis.sentimentLabel,
          kpiScore: scores.kpiScore
        });
      } catch (innerError) {
        console.error(`Failed to analyze conversation ${conversation.id}:`, innerError.message);
      }
    }

    return res.json({
      analyzedCount: results.length,
      results
    });
  } catch (error) {
    return next(error);
  }
}

async function runEmployeePrediction(req, res, next) {
  try {
    const employee = await Employee.findByPk(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const latestScore = await PerformanceScore.findOne({
      where: { employee_id: employee.id },
      order: [["createdAt", "DESC"]]
    });

    if (!latestScore) {
      return res.status(400).json({ message: "No performance data for this employee" });
    }

    const period = req.body?.period || "weekly";
    const periodWeight = PERIOD_WEIGHTS[period] || 1;

    const payload = {
      employeeId: employee.id,
      period,
      kpiScore: safeScore(latestScore.kpiScore * periodWeight),
      sentimentScore: latestScore.empathyScore / 100,
      resolutionScore: latestScore.resolutionScore,
      communicationScore: latestScore.communicationScore
    };

    const predictionResult = await predictEmployee(payload);

    const prediction = await Prediction.create({
      employee_id: employee.id,
      period,
      predictedEffectiveness: predictionResult.predictedEffectiveness,
      riskLevel: predictionResult.riskLevel,
      factors: predictionResult.factors
    });

    return res.json({
      employee,
      prediction
    });
  } catch (error) {
    return next(error);
  }
}

async function forecastScenario(req, res, next) {
  try {
    const employee = await Employee.findByPk(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const latestScore = await PerformanceScore.findOne({
      where: { employee_id: employee.id },
      order: [["createdAt", "DESC"]]
    });

    if (!latestScore) {
      return res.status(400).json({ message: "No performance data for this employee" });
    }

    const period = req.body?.period || "weekly";
    const adjustment = req.body?.adjustment || {};

    const scenarioPayload = {
      employeeId: employee.id,
      period,
      kpiScore: safeScore(Number(latestScore.kpiScore) + Number(adjustment.kpiDelta || 0)),
      sentimentScore: safeScore(Number(latestScore.empathyScore) + Number(adjustment.empathyDelta || 0)) / 100,
      resolutionScore: safeScore(Number(latestScore.resolutionScore) + Number(adjustment.resolutionDelta || 0)),
      communicationScore: safeScore(
        Number(latestScore.communicationScore) + Number(adjustment.communicationDelta || 0)
      )
    };

    const scenarioResult = await predictEmployee(scenarioPayload);

    return res.json({
      employee,
      baseScore: latestScore,
      adjustment,
      scenario: scenarioResult
    });
  } catch (error) {
    return next(error);
  }
}

async function dashboardReport(req, res, next) {
  try {
    const report = await getDashboardStats({
      language: req.query.language || "all",
      employeeId: req.query.employeeId || "all",
      team: req.query.team || "all"
    });
    return res.json(report);
  } catch (error) {
    return next(error);
  }
}

async function employeeHistory(req, res, next) {
  try {
    const employee = await Employee.findByPk(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const history = await getEmployeeHistory(employee.id);
    const insights = summarizeEmployeePerformance(history.scores, history.predictions);
    return res.json({ employee, ...history, insights });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  analyzeSingleConversation,
  analyzePendingConversations,
  runEmployeePrediction,
  forecastScenario,
  dashboardReport,
  employeeHistory
};
