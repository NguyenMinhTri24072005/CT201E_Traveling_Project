require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./src/models/Users");

const ADMIN_EMAIL = "admin@taybac.com";
const ADMIN_PASSWORD = "Admin@123456";
const ADMIN_FULLNAME = "Super Admin";

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(
        `⚠️  Tài khoản "${ADMIN_EMAIL}" đã tồn tại (role: ${existing.role}).`,
      );

      if (existing.role !== "Admin") {
        existing.role = "Admin";
        existing.isTrusted = true;
        existing.isLocked = false;
        await existing.save();
        console.log("🔄 Đã nâng cấp thành Admin.");
      } else {
        console.log("ℹ️  Đã là Admin, không cần thay đổi.");
      }
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "Admin",
        fullname: ADMIN_FULLNAME,
        phone: "0999999999",
        isTrusted: true,
        isLocked: false,
        createat: new Date(),
      });
      console.log("🎉 Tạo tài khoản Admin thành công!");
    }

    console.log("──────────────────────────────────");
    console.log(`  Email    : ${ADMIN_EMAIL}`);
    console.log(`  Password : ${ADMIN_PASSWORD}`);
    console.log(`  Role     : Admin`);
    console.log("──────────────────────────────────");
  } catch (err) {
    console.error("❌ Lỗi:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB");
    process.exit(0);
  }
}

createAdmin();
