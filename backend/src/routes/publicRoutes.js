const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/shop/:shopId',           publicController.getShopInfo);
router.post('/appointments',          publicController.createAppointment);
router.get('/busy-slots/:shopId',     publicController.getBusySlots);

// Cliente
router.get('/client/appointments/:phone', publicController.getClientAppointments);
router.post('/client/cancel',             publicController.cancelClientAppointment);

router.post('/client/register', publicController.clientRegister);
router.post('/client/login', publicController.clientLogin);
router.post('/client/subscribe', publicController.subscribePlan);

// Webhooks
const billingController = require('../controllers/billingController');
router.post('/billing/webhook/mp', billingController.handleWebhook);

module.exports = router;

