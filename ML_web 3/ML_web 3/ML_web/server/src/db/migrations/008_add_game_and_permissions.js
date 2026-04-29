async function up(queryInterface, Sequelize) {
  const conversationDefinition = await queryInterface.describeTable("conversation");
  if (!conversationDefinition.game_id) {
    await queryInterface.addColumn("conversation", "game_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "game",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    await queryInterface.addIndex("conversation", ["game_id"], { name: "idx_conversation_game_id" });
  }

  const employeeDefinition = await queryInterface.describeTable("employee");
  if (!employeeDefinition.supports_all_games) {
    await queryInterface.addColumn("employee", "supports_all_games", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  }

  if (!employeeDefinition.allowed_game_ids) {
    await queryInterface.addColumn("employee", "allowed_game_ids", {
      type: Sequelize.JSON,
      allowNull: true
    });
  }

  await queryInterface.sequelize.query(
    "UPDATE employee SET supports_all_games = 1 WHERE role = 'admin'"
  );
}

async function down(queryInterface) {
  await queryInterface.removeColumn("employee", "allowed_game_ids");
  await queryInterface.removeColumn("employee", "supports_all_games");
  await queryInterface.removeIndex("conversation", "idx_conversation_game_id");
  await queryInterface.removeColumn("conversation", "game_id");
}

module.exports = {
  name: "008_add_game_and_permissions",
  up,
  down
};
