const {
  Employee,
  Game,
  Customer,
  Conversation,
  Message,
  AnalysisResult,
  PerformanceScore
} = require("../db/models");
const { analyzeConversation } = require("../services/mlClient.service");
const { evaluatePerformance } = require("../services/evaluation.service");

function normalizeAllowedGameIds(allowedGameIds) {
  if (!Array.isArray(allowedGameIds)) return [];
  return allowedGameIds
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function canEmployeeSupportGame(employee, gameId) {
  if (!employee) return false;
  const normalizedRole = String(employee.role || "").trim().toLowerCase();
  if (normalizedRole === "leader" || normalizedRole === "admin") return true;
  if (employee.supportsAllGames) return true;
  if (!gameId) return false;
  const allowed = normalizeAllowedGameIds(employee.allowedGameIds);
  return allowed.includes(Number(gameId));
}

// Customer starts a new chat (no auth required)
async function startChat(req, res, next) {
  try {
    const { customerName, language, gameId } = req.body;

    if (!customerName || customerName.trim().length < 1) {
      return res.status(400).json({ message: "Please provide your name" });
    }

    if (!gameId) {
      return res.status(400).json({ message: "Please choose a game for support" });
    }

    const game = await Game.findByPk(gameId);
    if (!game || game.status !== "active") {
      return res.status(400).json({ message: "Selected game is not available" });
    }

    const [customer] = await Customer.findOrCreate({
      where: { name: customerName.trim() }
    });

    const conversation = await Conversation.create({
      customer_id: customer.id,
      employee_id: null,
      game_id: game.id,
      language: language || "en",
      status: "open",
      startedAt: new Date()
    });

    return res.status(201).json({
      conversationId: conversation.id,
      customerId: customer.id,
      customerName: customer.name,
      game,
      status: "open"
    });
  } catch (error) {
    return next(error);
  }
}

// Send a message in a conversation
async function sendMessage(req, res, next) {
  try {
    const { conversationId, senderType, text } = req.body;

    if (!conversationId || !senderType || !text) {
      return res.status(400).json({ message: "conversationId, senderType, and text are required" });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (senderType === "employee") {
      if (!conversation.employee_id) {
        return res.status(400).json({ message: "Conversation must be assigned before agent reply" });
      }

      const assignedEmployee = await Employee.findByPk(conversation.employee_id);
      if (!canEmployeeSupportGame(assignedEmployee, conversation.game_id)) {
        return res.status(403).json({ message: "Assigned agent is not allowed to support this game" });
      }
    }

    const lastCustomerMsg = await Message.findOne({
      where: { conversation_id: conversationId, senderType: "customer" },
      order: [["sentAt", "DESC"]]
    });

    const now = new Date();
    let responseTimeSec = null;
    if (senderType === "employee" && lastCustomerMsg) {
      responseTimeSec = Number(((now.getTime() - new Date(lastCustomerMsg.sentAt).getTime()) / 1000).toFixed(2));
    }

    const message = await Message.create({
      conversation_id: conversationId,
      senderType,
      text: text.trim(),
      sentAt: now,
      responseTimeSec
    });

    return res.status(201).json({
      id: message.id,
      conversationId,
      senderType: message.senderType,
      text: message.text,
      sentAt: message.sentAt,
      responseTimeSec: message.responseTimeSec
    });
  } catch (error) {
    return next(error);
  }
}

// Get messages for a conversation
async function getConversation(req, res, next) {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : null;
    let accessEmployee = null;

    if (employeeId) {
      accessEmployee = await Employee.findByPk(employeeId);
      if (!accessEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
    }

    const conversation = await Conversation.findByPk(req.params.id, {
      include: [
        { model: Employee, attributes: ["id", "name", "team"] },
        { model: Game, attributes: ["id", "name", "slug", "status"] },
        { model: Customer, attributes: ["id", "name"] },
        { model: Message, order: [["sentAt", "ASC"]] }
      ]
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (accessEmployee && !canEmployeeSupportGame(accessEmployee, conversation.game_id)) {
      return res.status(403).json({ message: "You are not allowed to view this game's conversation" });
    }

    return res.json(conversation);
  } catch (error) {
    return next(error);
  }
}

// List active (open) conversations for agents
async function listActiveChats(req, res, next) {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : null;
    let accessEmployee = null;

    if (employeeId) {
      accessEmployee = await Employee.findByPk(employeeId);
      if (!accessEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
    }

    const conversations = await Conversation.findAll({
      where: { status: "open" },
      include: [
        { model: Employee, attributes: ["id", "name", "team"] },
        { model: Game, attributes: ["id", "name", "slug", "status"] },
        { model: Customer, attributes: ["id", "name"] },
        { model: Message }
      ],
      order: [["createdAt", "DESC"]]
    });

    const visibleConversations = accessEmployee
      ? conversations.filter((item) => canEmployeeSupportGame(accessEmployee, item.game_id))
      : conversations;

    const result = visibleConversations.map(c => {
      const msgs = c.messages || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      return {
        id: c.id,
        customer: c.customer,
        employee: c.employee,
        game: c.game,
        gameId: c.game_id,
        employeeId: c.employee_id,
        language: c.language,
        status: c.status,
        messageCount: msgs.length,
        lastMessage: lastMsg ? { text: lastMsg.text, senderType: lastMsg.senderType, sentAt: lastMsg.sentAt } : null,
        createdAt: c.createdAt
      };
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

// Agent assigns themselves to a conversation
async function assignAgent(req, res, next) {
  try {
    const { employeeId } = req.body;
    const conversation = await Conversation.findByPk(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!canEmployeeSupportGame(employee, conversation.game_id)) {
      return res.status(403).json({ message: "This agent is not allowed to support the selected game" });
    }

    conversation.employee_id = employee.id;
    await conversation.save();

    return res.json({
      conversationId: conversation.id,
      assignedTo: { id: employee.id, name: employee.name, team: employee.team }
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Run ML analysis on a conversation (internal helper)
 * Calls the ML service to get sentiment + summary, then creates performance scores
 */
async function runAutoAnalysis(conversationId) {
  try {
    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: Employee, attributes: ["id", "name", "team"] },
        { model: Customer, attributes: ["id", "name"] },
        { model: Message }
      ]
    });

    if (!conversation || !conversation.employee_id) return null;

    const msgs = (conversation.messages || []).filter(
      (m) => !m.text.startsWith("[📞") && !m.text.startsWith("[🔊")
    );
    if (msgs.length < 2) return null;

    const messages = msgs.map((item) => ({
      senderType: item.senderType,
      text: item.text,
      responseTimeSec: item.responseTimeSec
    }));

    const analysis = await analyzeConversation(messages, conversation.language);
    const scores = evaluatePerformance(messages, analysis.sentimentScore);

    const [analysisResult, created] = await AnalysisResult.findOrCreate({
      where: { conversation_id: conversation.id },
      defaults: {
        conversation_id: conversation.id,
        summary: analysis.summary,
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        customerSatisfaction: scores.customerSatisfaction
      }
    });

    if (!created) {
      analysisResult.summary = analysis.summary;
      analysisResult.sentimentScore = analysis.sentimentScore;
      analysisResult.sentimentLabel = analysis.sentimentLabel;
      analysisResult.customerSatisfaction = scores.customerSatisfaction;
      await analysisResult.save();
    }

    await PerformanceScore.create({
      employee_id: conversation.employee_id,
      conversation_id: conversation.id,
      kpiScore: scores.kpiScore,
      communicationScore: scores.communicationScore,
      empathyScore: scores.empathyScore,
      resolutionScore: scores.resolutionScore
    });

    return {
      sentiment: analysis.sentimentLabel,
      kpiScore: scores.kpiScore,
      customerSatisfaction: scores.customerSatisfaction
    };
  } catch (error) {
    console.error("Auto-analysis failed for conversation", conversationId, error.message);
    return null;
  }
}

// Close a conversation + auto-analyze with ML
async function closeChat(req, res, next) {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    conversation.status = "resolved";
    conversation.endedAt = new Date();
    await conversation.save();

    // Auto-run ML analysis in background
    const analysisResult = await runAutoAnalysis(conversation.id);

    return res.json({
      message: "Conversation closed",
      id: conversation.id,
      analysis: analysisResult || "No analysis performed (insufficient data or no agent assigned)"
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Record a call event (start or end) for a conversation.
 * POST /api/chat/conversation/:id/call-event
 * Body: { event: "start"|"end", caller: "customer"|"employee", durationSec: number }
 */
async function recordCallEvent(req, res, next) {
  try {
    const { event, caller, durationSec } = req.body;
    const conversation = await Conversation.findByPk(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (caller === "employee") {
      if (!conversation.employee_id) {
        return res.status(400).json({ message: "Conversation must be assigned before agent call" });
      }
      const assignedEmployee = await Employee.findByPk(conversation.employee_id);
      if (!canEmployeeSupportGame(assignedEmployee, conversation.game_id)) {
        return res.status(403).json({ message: "Assigned agent is not allowed to support this game" });
      }
    }

    if (event === "start") {
      const callerLabel = caller === "employee" ? "Agent" : "Customer";
      await Message.create({
        conversation_id: conversation.id,
        senderType: caller || "customer",
        text: `[📞 ${callerLabel} started a voice call]`,
        sentAt: new Date(),
        responseTimeSec: null
      });

      return res.json({ message: "Call start recorded", conversationId: conversation.id });
    }

    if (event === "end") {
      const duration = Number(durationSec || 0);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      // Record call end as a system message
      await Message.create({
        conversation_id: conversation.id,
        senderType: caller || "employee",
        text: `[🔊 Voice call ended — Duration: ${durationStr}]`,
        sentAt: new Date(),
        responseTimeSec: duration > 0 ? duration : null
      });

      // If the call was long enough, run analysis immediately
      if (duration >= 10) {
        const analysisResult = await runAutoAnalysis(conversation.id);
        return res.json({
          message: "Call end recorded and analyzed",
          conversationId: conversation.id,
          callDuration: durationStr,
          analysis: analysisResult
        });
      }

      return res.json({
        message: "Call end recorded",
        conversationId: conversation.id,
        callDuration: durationStr
      });
    }

    return res.status(400).json({ message: "event must be 'start' or 'end'" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  startChat,
  sendMessage,
  getConversation,
  listActiveChats,
  assignAgent,
  closeChat,
  recordCallEvent
};

