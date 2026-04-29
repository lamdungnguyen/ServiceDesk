async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("game", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    slug: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "active"
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

  await queryInterface.addIndex("game", ["slug"], { unique: true, name: "uniq_game_slug" });
  await queryInterface.addIndex("game", ["status"], { name: "idx_game_status" });
}

async function down(queryInterface) {
  await queryInterface.dropTable("game");
}

module.exports = {
  name: "007_create_games_table",
  up,
  down
};
