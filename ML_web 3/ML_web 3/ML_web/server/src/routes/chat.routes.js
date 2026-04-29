const express = require("express");
const {
  startChat,
  sendMessage,
  getConversation,
  listActiveChats,
  assignAgent,
  closeChat,
  recordCallEvent
} = require("../controllers/chat.controller");

const router = express.Router();

// Public endpoints (customer side - no auth required)
router.post("/start", startChat);
router.post("/message", sendMessage);
router.get("/conversation/:id", getConversation);

// Agent endpoints
router.get("/active", listActiveChats);
router.put("/conversation/:id/assign", assignAgent);
router.put("/conversation/:id/close", closeChat);

// Call tracking
router.post("/conversation/:id/call-event", recordCallEvent);

module.exports = router;
