const express = require('express');
const router = express.Router();
const messageControllers = require('../controllers/messageControllers');
const { verifyToken } = require('../middleware/verifyToken');

router.post('/', verifyToken, messageControllers.addMessage);
router.get('/:userId', verifyToken, messageControllers.getMessages);

module.exports = router;