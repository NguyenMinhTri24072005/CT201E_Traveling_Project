const Notification = require("../models/Notification");
const User = require("../models/Users");
const notificationControllers = {
  getUserNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = notifications.filter((n) => !n.isRead).length;
      res.status(200).json({ notifications, unreadCount });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  markAsRead: async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
      res.status(200).json({ message: "Đã đọc" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  markAllAsRead: async (req, res) => {
    try {
      await Notification.updateMany(
        { recipient: req.user.id, isRead: false },
        { $set: { isRead: true } },
      );
      res.status(200).json({ message: "Đã đánh dấu đọc tất cả" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  createBroadcast: async (req, res) => {
    try {
      const { targetRole, title, message, link } = req.body;

      let query = {};
      if (targetRole && targetRole !== "All") {
        query.role = targetRole;
      }
      const users = await User.find(query).select("_id");
      if (users.length === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng nào thuộc nhóm này." });
      }
      const notificationsArray = users.map((user) => ({
        recipient: user._id,
        sender: req.user.id,
        title,
        message,
        type: "system",
        link: link || "",
      }));
      await Notification.insertMany(notificationsArray);
      res
        .status(200)
        .json({
          message: `Đã gửi thông báo thành công tới ${users.length} người.`,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getBroadcastHistory: async (req, res) => {
    try {
      const mongoose = require("mongoose");

      const history = await Notification.aggregate([
        {
          $match: {
            sender: new mongoose.Types.ObjectId(req.user.id),
            type: "system",
          },
        },
        {
          $group: {
            _id: { title: "$title", message: "$message", link: "$link" },
            createdAt: { $max: "$createdAt" },
            recipientCount: { $sum: 1 },
            readCount: { $sum: { $cond: ["$isRead", 1, 0] } },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);
      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  recallBroadcast: async (req, res) => {
    try {
      const { title, message } = req.body;
      const result = await Notification.deleteMany({
        sender: req.user.id,
        title: title,
        message: message,
        type: "system",
      });
      res
        .status(200)
        .json({
          message: `Đã thu hồi thông báo khỏi hộp thư của ${result.deletedCount} người.`,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
module.exports = notificationControllers;
