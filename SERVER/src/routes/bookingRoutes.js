const router = require('express').Router();
const bookingControllers = require('../controllers/bookingControllers');
const { verifyToken, verifyPartner, verifyAdmin } = require('../middleware/verifyToken');

// Partner lấy đơn hàng của riêng mình 
router.get('/partner', verifyPartner, bookingControllers.getPartnerBookings);

// Admin lấy toàn bộ đơn hàng hệ thống
router.get('/', verifyPartner, bookingControllers.getAllBookings);


router.post('/', verifyToken, bookingControllers.createBooking);
router.get('/user/:userId', verifyToken, bookingControllers.getBookingsByUserId);
router.patch('/cancel/:bookingId', verifyToken, bookingControllers.cancelBooking);
router.put('/:id/confirm-payment', verifyToken, bookingControllers.confirmPayment);
router.put('/:id/status', verifyPartner, bookingControllers.updateBookingStatus);
router.delete('/:id', verifyPartner, bookingControllers.deleteBooking);
router.get('/partner/stats', verifyPartner, bookingControllers.getPartnerStats);
router.get('/admin/stats', verifyAdmin, bookingControllers.getAdminStats);

module.exports = router;