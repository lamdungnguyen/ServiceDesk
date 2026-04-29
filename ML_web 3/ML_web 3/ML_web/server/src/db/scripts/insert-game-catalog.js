/**
 * Script thêm danh sách game mới vào database.
 * Chạy: node src/db/scripts/insert-game-catalog.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const sequelize = require("../../config/database");
const { initModels, Game } = require("../models");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function insertGameCatalog() {
  try {
    await sequelize.authenticate();
    initModels();
    console.log("Connected to database.");

    const titles = [
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

    for (const title of titles) {
      const slug = slugify(title);
      const [game, created] = await Game.findOrCreate({
        where: { slug },
        defaults: {
          name: title,
          slug,
          status: "active"
        }
      });

      if (created) {
        console.log(`✅ Added game: ${title}`);
      } else {
        if (game.name !== title || game.status !== "active") {
          game.name = title;
          game.status = "active";
          await game.save();
          console.log(`🔄 Updated game: ${title}`);
        } else {
          console.log(`⚪ Already exists: ${title}`);
        }
      }
    }

    await sequelize.close();
    console.log("\nGame catalog update complete.");
  } catch (error) {
    console.error("❌ Failed to update game catalog:", error.message);
    process.exit(1);
  }
}

insertGameCatalog();