const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/userControllers");
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");
const multer = require("multer");
const fs = require("fs");
const storagePath = "uploads/avatars/";
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storagePath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });
router.get("/profile", verifyToken, userControllers.getProfile);
router.put(
  "/profile",
  verifyToken,
  upload.single("avatar"),
  userControllers.updateProfile,
);
router.put("/change-password", verifyToken, userControllers.changePassword);
router.put(
  "/shop/update",
  verifyToken,
  upload.single("coverImage"),
  userControllers.updateShopProfile,
);
router.get("/shop/:partnerId", userControllers.getShopDetails);
module.exports = router;
