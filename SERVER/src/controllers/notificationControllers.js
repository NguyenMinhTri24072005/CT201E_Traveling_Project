const Notification = require('../models/Notification');
const User = require('../models/Users');

const notificationControllers = {
    // 1. Lấy danh sách thông báo của người đang đăng nhập
    getUserNotifications: async (req, res) => {
        try {
            const notifications = await Notification.find({ recipient: req.user.id })
                .sort({ createdAt: -1 }) // Mới nhất lên đầu
                .limit(50); // Chỉ lấy 50 cái gần nhất cho nhẹ máy
            
            const unreadCount = notifications.filter(n => !n.isRead).length;

            res.status(200).json({ notifications, unreadCount });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Đánh dấu 1 thông báo là đã đọc
    markAsRead: async (req, res) => {
        try {
            await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
            res.status(200).json({ message: "Đã đọc" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3. Đánh dấu TẤT CẢ là đã đọc
    markAllAsRead: async (req, res) => {
        try {
            await Notification.updateMany(
                { recipient: req.user.id, isRead: false },
                { $set: { isRead: true } }
            );
            res.status(200).json({ message: "Đã đánh dấu đọc tất cả" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ==========================================
    // [ADMIN] 4. GỬI THÔNG BÁO HÀNG LOẠT (BROADCAST)
    // ==========================================
    createBroadcast: async (req, res) => {
        try {
            const { targetRole, title, message, link } = req.body; // targetRole: 'All', 'Customer', 'Partner'
            
            // Tìm những người dùng phù hợp với Target
            let query = {};
            if (targetRole && targetRole !== 'All') {
                query.role = targetRole;
            }

            const users = await User.find(query).select('_id');
            
            if (users.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy người dùng nào thuộc nhóm này." });
            }

            // Tạo mảng thông báo để insert hàng loạt (Cực kỳ tối ưu hiệu suất)
            const notificationsArray = users.map(user => ({
                recipient: user._id,
                sender: req.user.id, // Admin gửi
                title,
                message,
                type: 'system',
                link: link || ''
            }));

            // InsertMany: Lưu hàng ngàn record vào DB chỉ trong chớp mắt
            await Notification.insertMany(notificationsArray);

            res.status(200).json({ message: `Đã gửi thông báo thành công tới ${users.length} người.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // ... (Các hàm cũ giữ nguyên)

    // ==========================================
    // [ADMIN] 5. LẤY LỊCH SỬ PHÁT THANH
    // ==========================================
    getBroadcastHistory: async (req, res) => {
        try {
            const mongoose = require('mongoose'); // Đảm bảo đã import mongoose
            // Dùng Aggregation để nhóm hàng ngàn thông báo lẻ thành 1 cục (dựa theo tiêu đề và nội dung)
            const history = await Notification.aggregate([
                { $match: { sender: new mongoose.Types.ObjectId(req.user.id), type: 'system' } },
                { $group: {
                    _id: { title: "$title", message: "$message", link: "$link" },
                    createdAt: { $max: "$createdAt" },
                    recipientCount: { $sum: 1 },
                    readCount: { $sum: { $cond: ["$isRead", 1, 0] } }
                }},
                { $sort: { createdAt: -1 } }
            ]);
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ==========================================
    // [ADMIN] 6. THU HỒI THÔNG BÁO HÀNG LOẠT
    // ==========================================
    recallBroadcast: async (req, res) => {
        try {
            const { title, message } = req.body;
            // Xóa sạch tất cả các thông báo có cùng tiêu đề và nội dung do Admin này gửi
            const result = await Notification.deleteMany({ 
                sender: req.user.id, 
                title: title, 
                message: message, 
                type: 'system' 
            });
            res.status(200).json({ message: `Đã thu hồi thông báo khỏi hộp thư của ${result.deletedCount} người.` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = notificationControllers;