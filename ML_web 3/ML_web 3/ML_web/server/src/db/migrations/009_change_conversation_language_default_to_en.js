async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("conversation", "language", {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "en"
  });
}

async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("conversation", "language", {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "vi"
  });
}

module.exports = {
  name: "009_change_conversation_language_default_to_en",
  up,
  down
};
