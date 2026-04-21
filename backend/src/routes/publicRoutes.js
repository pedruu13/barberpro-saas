const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/shop/:shopId',           publicController.getShopInfo);
router.post('/appointments',          publicController.createAppointment);
router.get('/busy-slots/:shopId',     publicController.getBusySlots);

// Cliente
router.get('/client/appointments/:phone', publicController.getClientAppointments);
router.post('/client/cancel',             publicController.cancelClientAppointment);

module.exports = router;
