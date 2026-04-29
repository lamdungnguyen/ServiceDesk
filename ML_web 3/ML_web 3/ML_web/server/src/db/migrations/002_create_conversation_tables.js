async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("conversation", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    employee_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "employee",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    customer_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "customer",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    },
    language: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "vi"
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "open"
    },
    started_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    ended_at: {
      type: Sequelize.DATE,
      allowNull: true
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

  await queryInterface.createTable("message", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
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
    sender_type: {
      type: Sequelize.STRING,
      allowNull: false
    },
    text: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    sent_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    response_time_sec: {
      type: Sequelize.FLOAT,
      allowNull: true
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

  await queryInterface.addIndex("conversation", ["employee_id"], { name: "idx_conversation_employee_id" });
  await queryInterface.addIndex("conversation", ["customer_id"], { name: "idx_conversation_customer_id" });
  await queryInterface.addIndex("message", ["conversation_id"], { name: "idx_message_conversation_id" });
}

async function down(queryInterface) {
  await queryInterface.dropTable("message");
  await queryInterface.dropTable("conversation");
}

module.exports = {
  name: "002_create_conversation_tables",
  up,
  down
};
