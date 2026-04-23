const User = require('../models/Users');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const userControllers = {
    // 1. LẤY THÔNG TIN PROFILE
    getProfile: async (req, res) => {
        try {
            // Lấy ID từ token (đã được giải mã qua middleware verifyToken)
            const user = await User.findById(req.user.id).select('-password');
            if (!user) return res.status(404).json("Không tìm thấy người dùng!");
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. CẬP NHẬT THÔNG TIN & AVATAR
    updateProfile: async (req, res) => {
        try {
            const { fullname, phone, cccd } = req.body;
            const user = await User.findById(req.user.id);

            if (!user) return res.status(404).json("Không tìm thấy người dùng!");

            user.fullname = fullname || user.fullname;
            user.phone = phone || user.phone;
            user.cccd = cccd || user.cccd;

            // Nếu có upload ảnh mới
            if (req.file) {
                // Xóa ảnh cũ (nếu không phải ảnh default)
                if (user.avatar && !user.avatar.includes('default')) {
                    const oldAvatarPath = path.join(__dirname, '../../', user.avatar);
                    if (fs.existsSync(oldAvatarPath)) {
                        fs.unlinkSync(oldAvatarPath);
                    }
                }
                user.avatar = `/uploads/avatars/${req.file.filename}`;
            }

            const updatedUser = await user.save();

            // Trả về data mới nhưng giấu password đi
            const { password, ...others } = updatedUser._doc;
            res.status(200).json(others);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Trích đoạn hàm đổi mật khẩu chuẩn:
    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const user = await User.findById(req.user.id);

            // 1. Kiểm tra mật khẩu cũ (Bắt buộc)
            const validPassword = await bcrypt.compare(oldPassword, user.password);
            if (!validPassword) return res.status(400).json("Mật khẩu cũ không đúng!");

            // 2. Băm mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);

            // 3. Lưu vào DB
            user.password = hashedNewPassword;
            await user.save();

            res.status(200).json("Đã đổi mật khẩu thành công!");
        } catch (error) {
            res.status(500).json(error.message);
        }
    },
    // ==========================================
    // [PARTNER] CẬP NHẬT THÔNG TIN GIAN HÀNG
    // ==========================================
    updateShopProfile: async (req, res) => {
        try {
            const { shopName, shopDescription, shopPolicies } = req.body;
            const updateData = { shopName, shopDescription, shopPolicies };
            
            // 👉 VÁ LỖI 1: Thêm 'avatars/' vào trước tên file để Frontend tải đúng đường dẫn
            if (req.file) {
                // Tùy theo định dạng cũ của em, nếu vẫn lỗi em có thể thử '/avatars/' (có dấu gạch chéo ở đầu)
                updateData.coverImage = '/uploads/avatars/' + req.file.filename; 
            }

            const User = require('../models/Users'); 
            
            // 👉 VÁ LỖI 2: Đổi { new: true } thành { returnDocument: 'after' } để triệt tiêu cảnh báo vàng
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id, 
                updateData, 
                { returnDocument: 'after' } 
            ).select('-password');
            
            res.status(200).json({ message: "Cập nhật gian hàng thành công!", user: updatedUser });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ==========================================
    // [CUSTOMER] LẤY CHI TIẾT GIAN HÀNG & CÁC TOUR CỦA HỌ
    // ==========================================
    getShopDetails: async (req, res) => {
        try {
            const partnerId = req.params.partnerId;
            const User = require('../models/Users');
            const Tour = require('../models/Tours');

            const partner = await User.findById(partnerId).select('fullname avatar shopName shopDescription coverImage shopPolicies isTrusted');
            
            if (!partner) return res.status(404).json({ message: "Không tìm thấy gian hàng!" });

            // Lấy toàn bộ Tour do Partner này tạo
            const tours = await Tour.find({ createdBy: partnerId });
            
            res.status(200).json({ partner, tours });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}; // <-- KẾT THÚC CỦA const userControllers = { ... }

module.exports = userControllers;