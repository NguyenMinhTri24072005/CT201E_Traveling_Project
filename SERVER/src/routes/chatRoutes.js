const express = require("express");
const router = express.Router();
const chatControllers = require("../controllers/chatControllers");
router.post("/", chatControllers.handleChat);
module.exports = router;
