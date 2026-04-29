async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("employee", "email", {
    type: Sequelize.STRING,
    allowNull: true,
    unique: false
  });

  await queryInterface.addColumn("employee", "password", {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: "123456"
  });

  await queryInterface.addColumn("employee", "role", {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: "agent"
  });
}

async function down(queryInterface) {
  await queryInterface.removeColumn("employee", "role");
  await queryInterface.removeColumn("employee", "password");
  await queryInterface.removeColumn("employee", "email");
}

module.exports = {
  name: "007a_add_employee_auth_columns",
  up,
  down
};
