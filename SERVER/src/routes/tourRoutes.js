const router = require("express").Router();
const tourControllers = require("../controllers/tourControllers");
const {
  verifyToken,
  verifyPartner,
  verifyAdmin,
} = require("../middleware/verifyToken");
const upload = require("../middleware/uploadMiddleware");
router.get("/:id/recommendations", tourControllers.getRecommendations);
router.get("/", tourControllers.getAllTours);
router.put(
  "/admin/bulk-status",
  verifyToken,
  verifyAdmin,
  tourControllers.bulkChangeTourStatus,
);
router.get("/:id", tourControllers.getTourById);
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "itineraryImages", maxCount: 15 },
  ]),
  tourControllers.createTour,
);
router.put(
  "/:id",
  verifyToken,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "itineraryImages", maxCount: 15 },
  ]),
  tourControllers.updateTour,
);
router.delete("/:id", verifyPartner, tourControllers.deleteTour);
router.get("/admin/all", verifyToken, tourControllers.getToursForAdmin);
router.put(
  "/:id/status",
  verifyToken,
  verifyAdmin,
  tourControllers.changeTourStatus,
);
module.exports = router;
