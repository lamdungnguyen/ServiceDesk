const {
  Employee,
  Prediction,
  PerformanceScore,
  AnalysisResult,
  Conversation
} = require("../db/models");

function normalizeAllowedGameIds(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
}

async function buildEmployeeData(emp) {
  const latestPrediction = await Prediction.findOne({
    where: { employee_id: emp.id },
    order: [["createdAt", "DESC"]]
  });

  let status = emp.status || "Active";
  
  // Only use dynamic status if the manual status is "Active"
  if (status === "Active" && latestPrediction) {
    if (latestPrediction.riskLevel === 'high') status = "At Risk";
    else if (latestPrediction.riskLevel === 'medium') status = "Warning";
  }

  const conversations = await Conversation.findAll({
    where: { employee_id: emp.id },
    include: [{ model: AnalysisResult, required: true }]
  });

  let csat = 0;
  if (conversations.length > 0) {
    const totalCsat = conversations.reduce((sum, conv) => {
      return sum + (conv.analysis_result?.customerSatisfaction || 0);
    }, 0);
    csat = Math.round(totalCsat / conversations.length);
  } else {
    const scores = await PerformanceScore.findAll({
      where: { employee_id: emp.id }
    });
    if (scores.length > 0) {
      const total = scores.reduce((sum, s) => sum + (s.kpiScore || 0), 0);
      csat = Math.round(total / scores.length);
    }
  }

  return {
    id: emp.id,
    name: emp.name,
    email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@falcongames.com`,
    team: emp.team,
    role: emp.role || "customer_care_agent",
    supportsAllGames: Boolean(emp.supportsAllGames),
    allowedGameIds: normalizeAllowedGameIds(emp.allowedGameIds),
    status,
    csat,
    createdAt: emp.createdAt
  };
}

async function listEmployees(req, res, next) {
  try {
    const employees = await Employee.findAll({ order: [["id", "ASC"]] });
    const teamData = await Promise.all(employees.map(buildEmployeeData));
    return res.json(teamData);
  } catch (error) {
    return next(error);
  }
}

async function createEmployee(req, res, next) {
  try {
    const { name, team, email, role, status, supportsAllGames, allowedGameIds } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    if (!team || team.trim().length < 1) {
      return res.status(400).json({ message: "Team is required" });
    }

    // Validate role - only allow customer_care_agent and leader
    const validRoles = ['customer_care_agent', 'leader'];
    if (role && !validRoles.includes(role.trim())) {
      return res.status(400).json({ message: "Invalid role. Only 'customer_care_agent' and 'leader' are allowed." });
    }

    const employee = await Employee.create({
      name: name.trim(),
      team: team.trim(),
      email: email?.trim() || null,
      role: role?.trim() || "customer_care_agent",
      supportsAllGames: toBoolean(supportsAllGames, role?.trim() === "leader"),
      allowedGameIds: normalizeAllowedGameIds(allowedGameIds),
      status: status || "Active",
      password: req.body.password || "123456"
    });

    const data = await buildEmployeeData(employee);
    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { name, team, email, role, status, supportsAllGames, allowedGameIds } = req.body;

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({ message: "Name must be at least 2 characters" });
      }
      employee.name = name.trim();
    }
    if (team !== undefined) employee.team = team.trim();
    if (email !== undefined) employee.email = email.trim();
    if (role !== undefined) {
      const validRoles = ['customer_care_agent', 'leader'];
      if (!validRoles.includes(role.trim())) {
        return res.status(400).json({ message: "Invalid role. Only 'customer_care_agent' and 'leader' are allowed." });
      }
      employee.role = role.trim();
    }
    if (supportsAllGames !== undefined) employee.supportsAllGames = toBoolean(supportsAllGames, employee.supportsAllGames);
    if (allowedGameIds !== undefined) employee.allowedGameIds = normalizeAllowedGameIds(allowedGameIds);
    if (status !== undefined) employee.status = status;
    if (req.body.password) employee.password = req.body.password;

    if (String(employee.role || "").toLowerCase() === "leader") {
      employee.supportsAllGames = true;
    }

    await employee.save();

    const data = await buildEmployeeData(employee);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Clean up related data
    await Prediction.destroy({ where: { employee_id: employee.id } });
    await PerformanceScore.destroy({ where: { employee_id: employee.id } });

    // Remove conversations and their related data
    const conversations = await Conversation.findAll({ where: { employee_id: employee.id } });
    for (const conv of conversations) {
      await AnalysisResult.destroy({ where: { conversation_id: conv.id } });
    }
    await Conversation.destroy({ where: { employee_id: employee.id } });

    await employee.destroy();

    return res.json({ message: "Employee deleted successfully", id: Number(req.params.id) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
