async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("employee", "status", {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: "Active"
  });
}

async function down(queryInterface) {
  await queryInterface.removeColumn("employee", "status");
}

module.exports = {
  name: "006_add_status_to_employee",
  up,
  down
};
