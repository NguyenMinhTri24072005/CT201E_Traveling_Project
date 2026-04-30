const express = require("express");
const router = express.Router();
const notificationControllers = require("../controllers/notificationControllers");
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");
router.get("/", verifyToken, notificationControllers.getUserNotifications);
router.put("/:id/read", verifyToken, notificationControllers.markAsRead);
router.put("/read-all", verifyToken, notificationControllers.markAllAsRead);
router.post(
  "/broadcast",
  verifyToken,
  verifyAdmin,
  notificationControllers.createBroadcast,
);
router.get(
  "/broadcast-history",
  verifyToken,
  verifyAdmin,
  notificationControllers.getBroadcastHistory,
);
router.post(
  "/recall",
  verifyToken,
  verifyAdmin,
  notificationControllers.recallBroadcast,
);
module.exports = router;
