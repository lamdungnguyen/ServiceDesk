const sequelize = require("../config/database");
const { runMigrations } = require("./migrate");
const { runSeeds } = require("./seed");

async function initDb() {
  await sequelize.authenticate();
  await runMigrations();
  await runSeeds();
}

if (require.main === module) {
  initDb()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("Database initialized with migrations and seeds");
      return sequelize.close();
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Database init failed", error);
      process.exit(1);
    });
}

module.exports = {
  initDb
};
