const Message = require('../models/Message');

const messageControllers = {
    // 1. Lưu tin nhắn vào DB
    addMessage: async (req, res) => {
        try {
            const { to, text } = req.body;
            const from = req.user.id; // Lấy ID người đang đăng nhập từ token

            const data = await Message.create({
                sender: from,
                receiver: to,
                text: text
            });

            if (data) return res.status(200).json({ message: "Gửi thành công", data });
            return res.status(400).json({ message: "Lỗi lưu tin nhắn" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Lấy lịch sử đoạn chat giữa 2 người (Current User và User B)
    getMessages: async (req, res) => {
        try {
            const from = req.user.id;
            const to = req.params.userId;

            // Tìm tất cả tin nhắn mà A gửi B, hoặc B gửi A
            const messages = await Message.find({
                $or: [
                    { sender: from, receiver: to },
                    { sender: to, receiver: from }
                ]
            }).sort({ createdAt: 1 }); // Sắp xếp cũ lên trên, mới xuống dưới giống Messenger

            // Map lại dữ liệu để Frontend dễ dùng hơn (biết ai là mình, ai là người kia)
            const projectedMessages = messages.map((msg) => {
                return {
                    fromSelf: msg.sender.toString() === from,
                    text: msg.text,
                    createdAt: msg.createdAt
                };
            });

            res.status(200).json(projectedMessages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = messageControllers;