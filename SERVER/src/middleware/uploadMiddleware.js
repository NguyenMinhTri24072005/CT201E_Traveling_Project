// SERVER/src/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Đảm bảo bạn đã tạo thư mục này trong SERVER: public/uploads/tours
        cb(null, 'uploads/tours'); 
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });
module.exports = upload;