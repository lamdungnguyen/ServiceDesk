const { Game } = require("../db/models");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function listGames(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const games = await Game.findAll({
      where: includeInactive ? undefined : { status: "active" },
      order: [["name", "ASC"]]
    });

    return res.json(games);
  } catch (error) {
    return next(error);
  }
}

async function createGame(req, res, next) {
  try {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2) {
      return res.status(400).json({ message: "Game name must be at least 2 characters" });
    }

    const slug = slugify(name);
    const existing = await Game.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ message: "Game already exists" });
    }

    const game = await Game.create({
      name,
      slug,
      status: "active"
    });

    return res.status(201).json(game);
  } catch (error) {
    return next(error);
  }
}

async function updateGame(req, res, next) {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (name.length < 2) {
        return res.status(400).json({ message: "Game name must be at least 2 characters" });
      }

      const slug = slugify(name);
      const duplicate = await Game.findOne({ where: { slug } });
      if (duplicate && Number(duplicate.id) !== Number(game.id)) {
        return res.status(409).json({ message: "Another game already uses this name" });
      }

      game.name = name;
      game.slug = slug;
    }

    if (req.body?.status !== undefined) {
      const status = String(req.body.status || "").trim().toLowerCase();
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Status must be active or inactive" });
      }
      game.status = status;
    }

    await game.save();
    return res.json(game);
  } catch (error) {
    return next(error);
  }
}

async function archiveGame(req, res, next) {
  try {
    const game = await Game.findByPk(req.params.id);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    game.status = "inactive";
    await game.save();
    return res.json({ message: "Game archived", game });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listGames,
  createGame,
  updateGame,
  archiveGame
};
