const express = require("express");
const {
  ingestConversation,
  listConversations
} = require("../controllers/conversation.controller");

const router = express.Router();

router.get("/", listConversations);
router.post("/", ingestConversation);

module.exports = router;
