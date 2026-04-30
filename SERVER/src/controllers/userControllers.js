const User = require("../models/Users");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const userControllers = {
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json("Không tìm thấy người dùng!");
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  updateProfile: async (req, res) => {
    try {
      const { fullname, phone, cccd } = req.body;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json("Không tìm thấy người dùng!");
      user.fullname = fullname || user.fullname;
      user.phone = phone || user.phone;
      user.cccd = cccd || user.cccd;
      if (req.file) {
        if (user.avatar && !user.avatar.includes("default")) {
          const oldAvatarPath = path.join(__dirname, "../../", user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        user.avatar = `/uploads/avatars/${req.file.filename}`;
      }
      const updatedUser = await user.save();
      const { password, ...others } = updatedUser._doc;
      res.status(200).json(others);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);
      const validPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validPassword)
        return res.status(400).json("Mật khẩu cũ không đúng!");
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedNewPassword;
      await user.save();
      res.status(200).json("Đã đổi mật khẩu thành công!");
    } catch (error) {
      res.status(500).json(error.message);
    }
  },
  updateShopProfile: async (req, res) => {
    try {
      const { shopName, shopDescription, shopPolicies } = req.body;
      const updateData = { shopName, shopDescription, shopPolicies };
      if (req.file) {
        updateData.coverImage = "/uploads/avatars/" + req.file.filename;
      }
      const User = require("../models/Users");
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { returnDocument: "after" },
      ).select("-password");
      res
        .status(200)
        .json({ message: "Cập nhật gian hàng thành công!", user: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  getShopDetails: async (req, res) => {
    try {
      const partnerId = req.params.partnerId;
      const User = require("../models/Users");
      const Tour = require("../models/Tours");
      const partner = await User.findById(partnerId).select(
        "fullname avatar shopName shopDescription coverImage shopPolicies isTrusted",
      );
      if (!partner)
        return res.status(404).json({ message: "Không tìm thấy gian hàng!" });
      const tours = await Tour.find({ createdBy: partnerId });
      res.status(200).json({ partner, tours });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = userControllers;
