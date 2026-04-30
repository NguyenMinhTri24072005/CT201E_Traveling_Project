const router = require("express").Router();
const cartController = require("../controllers/cartControllers.js");
const { verifyToken } = require("../middleware/verifyToken.js");
router.post("/add", verifyToken, cartController.addToCart);
router.get("/", verifyToken, cartController.getCart);
router.delete("/:itemId", verifyToken, cartController.removeFromCart);
module.exports = router;
