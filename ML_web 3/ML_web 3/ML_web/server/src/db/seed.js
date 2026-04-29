const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");
const { initModels } = require("./models");

const seedsDir = path.join(__dirname, "seeds");

async function ensureSeedTable() {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS schema_seeds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

function loadSeeds() {
  return fs
    .readdirSync(seedsDir)
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => require(path.join(seedsDir, file)));
}

async function getExecutedSeeds() {
  const rows = await sequelize.query("SELECT name FROM schema_seeds", {
    type: QueryTypes.SELECT
  });

  return new Set(rows.map((row) => row.name));
}

async function runSeeds() {
  await ensureSeedTable();
  initModels();

  const seeds = loadSeeds();
  const executed = await getExecutedSeeds();

  for (const seed of seeds) {
    if (executed.has(seed.name)) {
      continue;
    }

    await seed.up();
    await sequelize.query("INSERT INTO schema_seeds (name) VALUES (:name)", {
      replacements: { name: seed.name }
    });
  }
}

module.exports = {
  runSeeds
};

if (require.main === module) {
  sequelize
    .authenticate()
    .then(runSeeds)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log("Seeds applied successfully");
      return sequelize.close();
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Seeding failed", error);
      process.exit(1);
    });
}
