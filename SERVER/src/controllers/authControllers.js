require('dotenv').config();
const User = require('../models/Users.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


const authControllers = {
    register: async (req, res) => {
        try {
            // 👉 THÊM 'role' vào danh sách nhận từ req.body
            const { email, password, fullname, phone, address, role } = req.body;

            const userExits = await User.findOne({ email })
            if (userExits) return res.status(400).json({
                message: "Email đã được sử dụng"
            })


            let assignedRole = role || 'Customer';
            if (assignedRole === 'Admin') {
                assignedRole = 'Customer';
            }

            // Băm mật khẩu
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                email,
                password: hashedPassword,
                fullname,
                phone,
                address,
                // 👉 ĐƯA ROLE VÀO LƯU (Nếu không gửi lên thì mặc định là 'Customer')
                role: assignedRole,
                createat: new Date()
            })

            await newUser.save();
            res.status(201).json({
                message: "Đăng ký thành công!"
            })
        } catch (error) {
            res.status(500).json({
                error: error.message
            })
        }
    },


    login: async (req, res) => {
        try {
            // 1. Nhận username (có thể là email hoặc sđt) từ Frontend gửi lên
            const { username, password } = req.body;

            // 2. Tìm user có email HOẶC phone khớp với username
            const user = await User.findOne({
                $or: [
                    { email: username },
                    { phone: username }
                ]
            });

            if (!user) {
                return res.status(404).json({ message: 'Tài khoản không tồn tại!' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({
                message: "Mật khẩu sai rồi mày",
                usn: username,
                pw: password
            })

            if (user.isLocked) {
                return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa bởi Admin!" });
            }

            if (user && isMatch) {
                const accessToken = jwt.sign(
                    {
                        id: user._id,
                        role: user.role
                    },
                    process.env.JWT_ACCESS_KEY,
                    {
                        expiresIn: "30d"
                    }
                )

                console.log("accessToken trong authController", accessToken)
                const { password: storedPassword, ...others } = user._doc;

                // SỬA LẠI ĐOẠN NÀY ĐỂ FRONTEND NHẬN ĐÚNG DỮ LIỆU
                res.status(200).json({
                    message: "Đăng nhập thành công",
                    user: others, // Đưa thông tin vào trong object user
                    accessToken
                })
            };

        } catch (error) {
            res.status(500).json({
                error: error.message
            })
        }
    },

    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id; // Lấy từ verifyToken
            const { fullname, phone, address } = req.body;

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { fullname, phone, address } },
                { new: true } // Trả về dữ liệu sau khi đã cập nhật
            ).select('-password'); // Không trả về mật khẩu cho an toàn

            res.status(200).json({
                message: "Cập nhật hồ sơ thành công!",
                user: updatedUser
            });
        } catch (error) {
            res.status(500).json(error.message);
        }
    },

    // Lấy tất cả người dùng (Chỉ dành cho Admin)
    getAllUsers: async (req, res) => {
        try {
            // Không lấy trường password ra để bảo mật
            const users = await User.find().select('-password').sort({ createdAt: -1 });
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    createUserByAdmin: async (req, res) => {
        try {
            const { fullname, email, password, role } = req.body;
            
            // Kiểm tra email trùng
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ message: "Email đã tồn tại!" });

            // Băm mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Lưu User mới
            const newUser = new User({ fullname, email, password: hashedPassword, role });
            await newUser.save();
            
            res.status(201).json({ message: "Tạo tài khoản thành công!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    // 5. Cập nhật thông tin (Sửa tên, SĐT, Địa chỉ, Quyền)
    updateUser: async (req, res) => {
        try {
            const { fullname, phone, address, role } = req.body;
            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { $set: { fullname, phone, address, role } },
                { new: true }
            ).select('-password');

            if (!updatedUser) return res.status(404).json("Không tìm thấy User!");
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    toggleLockUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json("Không tìm thấy User!");
            
            if (user.role === 'Admin') return res.status(403).json("Không thể khóa tài khoản Admin!");

            user.isLocked = !user.isLocked; 
            await user.save();
            res.status(200).json({ message: user.isLocked ? "Tài khoản đã bị khóa" : "Tài khoản đã được mở khóa" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    deleteUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json("Không tìm thấy User!");

            if (user.role === 'Admin') return res.status(403).json("Không thể xóa tài khoản Admin!");

            await User.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Xóa tài khoản thành công!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    createUserByAdmin: async (req, res) => {
        try {
            const { email, password, fullname, phone, address, role } = req.body;

            // Kiểm tra trùng email
            const userExists = await User.findOne({ email });
            if (userExists) return res.status(400).json({ message: "Email này đã tồn tại!" });

            // Băm mật khẩu (Admin đặt mật khẩu mặc định)
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = new User({
                email,
                password: hashedPassword,
                fullname,
                phone,
                address,
                role: role || 'Customer',
                createat: new Date()
            });

            await newUser.save();
            res.status(201).json({ message: "Tạo tài khoản thành công!", user: newUser });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Admin cập nhật thông tin (Đã viết ở bước trước, em kiểm tra lại nhé)
    updateUserByAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Nếu Admin có đổi mật khẩu cho User thì băm lại
            if (updateData.password) {
                updateData.password = await bcrypt.hash(updateData.password, 10);
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            ).select('-password');

            res.status(200).json({ message: "Cập nhật thành công!", user: updatedUser });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateCommission: async (req, res) => {
        try {
            const { commissionRate } = req.body;
            const userId = req.params.id;

            if (commissionRate < 0 || commissionRate > 100) {
                return res.status(400).json({ message: "Tỷ lệ hoa hồng phải từ 0 đến 100." });
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId, 
                { commissionRate }, 
                { new: true }
            ).select('-password');

            if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy người dùng." });

            res.status(200).json({ message: `Đã cập nhật chiết khấu thành ${commissionRate}%`, user: updatedUser });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    getChatContacts: async (req, res) => {
        try {
            // Tìm tất cả người dùng ($ne: không bằng id của chính mình)
            // .select() giúp chỉ lấy các trường cần thiết, tuyệt đối không lộ mật khẩu hay sđt
            const users = await User.find({ _id: { $ne: req.user.id } })
                                    .select('_id fullname avatar role');
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = authControllers;