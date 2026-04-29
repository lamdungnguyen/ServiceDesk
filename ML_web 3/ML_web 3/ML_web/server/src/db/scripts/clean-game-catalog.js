/**
 * Script xóa các game cũ không nằm trong danh sách Game Catalog mới.
 * Chạy: node src/db/scripts/clean-game-catalog.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const { Op } = require("sequelize");
const sequelize = require("../../config/database");
const { initModels, Game } = require("../models");

const ALLOWED_GAMES = [
  "1945 Air Force",
  "Galaxiga",
  "Foodie Skewer",
  "Falcon Squad",
  "Good Sorting",
  "Screw Puzzle",
  "Hexa Sort",
  "Cake Sort",
  "Bus Away",
  "Black Hole Master"
];

async function cleanGameCatalog() {
  try {
    await sequelize.authenticate();
    initModels();
    console.log("Connected to database.");

    const deleted = await Game.destroy({
      where: {
        name: {
          [Op.notIn]: ALLOWED_GAMES
        }
      }
    });

    console.log(`✅ Deleted ${deleted} old game(s) from the catalog.`);
    await sequelize.close();
    console.log("Game catalog cleanup complete.");
  } catch (error) {
    console.error("❌ Failed to clean game catalog:", error.message);
    process.exit(1);
  }
}

cleanGameCatalog();