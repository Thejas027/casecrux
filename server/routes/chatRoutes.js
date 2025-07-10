const express = require("express");
const { handleChat } = require("../controllers/chatController");

const router = express.Router();

// standard response
router.post("/", handleChat);

// streaming support
router.post("/stream", (req, res) => {
  req.body.stream = true;
  handleChat(req, res);
});

module.exports = router;
