const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/userControllers');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');
const multer = require('multer');
const fs = require('fs');

// Tạo thư mục nếu chưa có
const storagePath = 'uploads/avatars/';
if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
}

// Cấu hình Multer: Lưu file vào uploads/avatars/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storagePath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });

// ==========================================
// CÁC ROUTES CƠ BẢN CỦA USER
// ==========================================
router.get('/profile', verifyToken, userControllers.getProfile);
router.put('/profile', verifyToken, upload.single('avatar'), userControllers.updateProfile);
router.put('/change-password', verifyToken, userControllers.changePassword);

// ==========================================
// 👉 ROUTES MỚI: TÍNH NĂNG GIAN HÀNG ĐỐI TÁC
// ==========================================
// 1. Partner tự cập nhật gian hàng (Dùng chung bộ upload để lưu ảnh bìa vào folder avatars)
router.put('/shop/update', verifyToken, upload.single('coverImage'), userControllers.updateShopProfile);

// 2. Khách hàng (hoặc ai cũng được) vào xem gian hàng
router.get('/shop/:partnerId', userControllers.getShopDetails);

module.exports = router;