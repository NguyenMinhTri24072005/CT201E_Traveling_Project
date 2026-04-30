const Message = require("../models/Message");
const messageControllers = {
  addMessage: async (req, res) => {
    try {
      const { to, text } = req.body;
      const from = req.user.id;

      const data = await Message.create({
        sender: from,
        receiver: to,
        text: text,
      });
      if (data)
        return res.status(200).json({ message: "Gửi thành công", data });
      return res.status(400).json({ message: "Lỗi lưu tin nhắn" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getMessages: async (req, res) => {
    try {
      const from = req.user.id;
      const to = req.params.userId;
      const messages = await Message.find({
        $or: [
          { sender: from, receiver: to },
          { sender: to, receiver: from },
        ],
      }).sort({ createdAt: 1 });

      const projectedMessages = messages.map((msg) => {
        return {
          fromSelf: msg.sender.toString() === from,
          text: msg.text,
          createdAt: msg.createdAt,
        };
      });
      res.status(200).json(projectedMessages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
module.exports = messageControllers;
