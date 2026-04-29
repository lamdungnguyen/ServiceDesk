const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Employee = sequelize.define("employee", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  team: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "General"
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "123456"
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "customer_care_agent"
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "Active"
  },
  supportsAllGames: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: "supports_all_games",
    defaultValue: false
  },
  allowedGameIds: {
    type: DataTypes.JSON,
    allowNull: true,
    field: "allowed_game_ids"
  }
});

const Game = sequelize.define("game", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "active"
  }
});

const Customer = sequelize.define("customer", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Conversation = sequelize.define("conversation", {
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "en"
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "open"
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "started_at",
    defaultValue: DataTypes.NOW
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "ended_at"
  },
  gameId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "game_id"
  }
});

const Message = sequelize.define("message", {
  senderType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "sender_type"
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "sent_at",
    defaultValue: DataTypes.NOW
  },
  responseTimeSec: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: "response_time_sec"
  }
});

const AnalysisResult = sequelize.define("analysis_result", {
  summary: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sentimentScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: "sentiment_score"
  },
  sentimentLabel: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "sentiment_label"
  },
  customerSatisfaction: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: "customer_satisfaction"
  }
});

const PerformanceScore = sequelize.define("performance_score", {
  kpiScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: "kpi_score"
  },
  communicationScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: "communication_score"
  },
  empathyScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: "empathy_score"
  },
  resolutionScore: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: "resolution_score"
  }
});

const Prediction = sequelize.define("prediction", {
  period: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "weekly"
  },
  predictedEffectiveness: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: "predicted_effectiveness"
  },
  riskLevel: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "risk_level"
  },
  factors: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

const Setting = sequelize.define("setting", {
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "general"
  }
}, {
  tableName: "settings",
  timestamps: true,
  underscored: true
});

function initModels() {
  Game.hasMany(Conversation, { foreignKey: "game_id" });
  Conversation.belongsTo(Game, { foreignKey: "game_id" });

  Employee.hasMany(Conversation, { foreignKey: "employee_id" });
  Conversation.belongsTo(Employee, { foreignKey: "employee_id" });

  Customer.hasMany(Conversation, { foreignKey: "customer_id" });
  Conversation.belongsTo(Customer, { foreignKey: "customer_id" });

  Conversation.hasMany(Message, { foreignKey: "conversation_id" });
  Message.belongsTo(Conversation, { foreignKey: "conversation_id" });

  Conversation.hasOne(AnalysisResult, { foreignKey: "conversation_id" });
  AnalysisResult.belongsTo(Conversation, { foreignKey: "conversation_id" });

  Employee.hasMany(PerformanceScore, { foreignKey: "employee_id" });
  PerformanceScore.belongsTo(Employee, { foreignKey: "employee_id" });

  Conversation.hasMany(PerformanceScore, { foreignKey: "conversation_id" });
  PerformanceScore.belongsTo(Conversation, { foreignKey: "conversation_id" });

  Employee.hasMany(Prediction, { foreignKey: "employee_id" });
  Prediction.belongsTo(Employee, { foreignKey: "employee_id" });
}

module.exports = {
  initModels,
  Game,
  Employee,
  Customer,
  Conversation,
  Message,
  AnalysisResult,
  PerformanceScore,
  Prediction,
  Setting
};
