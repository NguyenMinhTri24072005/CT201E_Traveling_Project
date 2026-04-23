const express = require('express');
const router = express.Router();
const reviewControllers = require('../controllers/reviewControllers');
const { verifyToken } = require('../middleware/verifyToken');

router.post('/', verifyToken, reviewControllers.createReview);
router.get('/tour/:tourId', reviewControllers.getTourReviews);
router.get('/booking/:bookingId', verifyToken, reviewControllers.getReviewByBooking);
router.put('/:id', verifyToken, reviewControllers.updateReview);

module.exports = router;