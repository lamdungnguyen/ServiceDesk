async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("conversation", "employee_id", {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: "employee",
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  });
}

async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("conversation", "employee_id", {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: "employee",
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT"
  });
}

module.exports = {
  name: "005_fix_employee_id_nullability",
  up,
  down
};
