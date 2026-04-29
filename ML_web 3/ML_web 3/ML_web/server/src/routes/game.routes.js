const express = require("express");
const {
	listGames,
	createGame,
	updateGame,
	archiveGame
} = require("../controllers/game.controller");

const router = express.Router();

router.get("/", listGames);
router.post("/", createGame);
router.put("/:id", updateGame);
router.delete("/:id", archiveGame);

module.exports = router;
