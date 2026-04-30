const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/authControllers.js");
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken.js");
router.post("/register", authControllers.register);
router.post("/login", authControllers.login);
router.put("/profile", verifyToken, authControllers.updateProfile);
router.get("/chat-contacts", verifyToken, authControllers.getChatContacts);
router.get("/users", verifyAdmin, authControllers.getAllUsers);
router.post("/users", verifyAdmin, authControllers.createUserByAdmin);
router.put("/users/:id", verifyAdmin, authControllers.updateUserByAdmin);
router.patch("/users/lock/:id", verifyAdmin, authControllers.toggleLockUser);
router.delete("/users/:id", verifyAdmin, authControllers.deleteUser);
router.put(
  "/users/:id/commission",
  verifyAdmin,
  authControllers.updateCommission,
);
module.exports = router;
