const express = require('express');
const router = express.Router();
const chatControllers = require('../controllers/chatControllers');
const jwt = require('jsonwebtoken');

// Middleware không bắt buộc đăng nhập:
// - Có token hợp lệ → decode và gắn req.user
// - Không có token hoặc token lỗi → bỏ qua, tiếp tục với req.user = null
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
            if (!err) req.user = user; // chỉ gắn nếu token hợp lệ
            next(); // luôn tiếp tục dù có lỗi hay không
        });
    } else {
        next(); // không có token → tiếp tục bình thường
    }
};

router.post('/', optionalAuth, chatControllers.handleChat);

module.exports = router;