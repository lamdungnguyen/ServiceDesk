const { Game } = require("../models");

const GAME_TITLES = [
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

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function up() {
  for (const title of GAME_TITLES) {
    await Game.findOrCreate({
      where: { slug: slugify(title) },
      defaults: {
        name: title,
        slug: slugify(title),
        status: "active"
      }
    });
  }
}

module.exports = {
  name: "002_seed_games",
  up
};
