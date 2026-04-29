const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");

const migrationsDir = path.join(__dirname, "migrations");

async function ensureMigrationTable() {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

function loadMigrations() {
  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => {
      const migration = require(path.join(migrationsDir, file));
      return {
        ...migration,
        file
      };
    });
}

async function getExecutedMigrations() {
  const rows = await sequelize.query("SELECT name FROM schema_migrations", {
    type: QueryTypes.SELECT
  });

  return new Set(rows.map((row) => row.name));
}

async function runMigrations() {
  await ensureMigrationTable();

  const queryInterface = sequelize.getQueryInterface();
  const migrations = loadMigrations();
  const executed = await getExecutedMigrations();

  for (const migration of migrations) {
    if (executed.has(migration.name)) {
      continue;
    }

    await migration.up(queryInterface, sequelize.Sequelize);
    await sequelize.query("INSERT INTO schema_migrations (name) VALUES (:name)", {
      replacements: { name: migration.name }
    });
  }
}

module.exports = {
  runMigrations
};

if (require.main === module) {
  sequelize
    .authenticate()
    .then(runMigrations)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("Migrations applied successfully");
      return sequelize.close();
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Migration failed", error);
      process.exit(1);
    });
}
