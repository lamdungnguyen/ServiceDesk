async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("analysis_result", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    conversation_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "conversation",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    summary: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    sentiment_score: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    sentiment_label: {
      type: Sequelize.STRING,
      allowNull: false
    },
    customer_satisfaction: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  });

  await queryInterface.createTable("performance_score", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    employee_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "employee",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    conversation_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "conversation",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    kpi_score: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    communication_score: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    empathy_score: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    resolution_score: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  });

  await queryInterface.createTable("prediction", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    employee_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "employee",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    period: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "weekly"
    },
    predicted_effectiveness: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    risk_level: {
      type: Sequelize.STRING,
      allowNull: false
    },
    factors: {
      type: Sequelize.JSON,
      allowNull: false
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  });

  await queryInterface.addIndex("analysis_result", ["conversation_id"], { name: "idx_analysis_conversation_id" });
  await queryInterface.addIndex("performance_score", ["employee_id"], { name: "idx_perf_employee_id" });
  await queryInterface.addIndex("performance_score", ["conversation_id"], { name: "idx_perf_conversation_id" });
  await queryInterface.addIndex("prediction", ["employee_id"], { name: "idx_prediction_employee_id" });
}

async function down(queryInterface) {
  await queryInterface.dropTable("prediction");
  await queryInterface.dropTable("performance_score");
  await queryInterface.dropTable("analysis_result");
}

module.exports = {
  name: "003_create_analytics_tables",
  up,
  down
};
