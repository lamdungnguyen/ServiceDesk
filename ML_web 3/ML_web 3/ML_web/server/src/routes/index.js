const express = require("express");
const conversationRoutes = require("./conversation.routes");
const evaluationRoutes = require("./evaluation.routes");
const employeeRoutes = require("./employee.routes");
const chatRoutes = require("./chat.routes");
const authRoutes = require("./auth.routes");
const settingsRoutes = require("./settings.routes");
const gameRoutes = require("./game.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/conversations", conversationRoutes);
router.use("/evaluation", evaluationRoutes);
router.use("/team", employeeRoutes);
router.use("/chat", chatRoutes);
router.use("/settings", settingsRoutes);
router.use("/games", gameRoutes);

module.exports = router;
