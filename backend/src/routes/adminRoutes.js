const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const { requireActivePlan } = require('../middlewares/planMiddleware');

// Shop & Plan settings (do not require active plan to view plan or update billing)
router.get('/shop', adminController.getShopSettings);
router.put('/shop', adminController.updateShopSettings);
router.get('/plan', adminController.getPlanStatus);

// Protect all following routes with active plan check
router.use(requireActivePlan);

router.get('/data', adminController.getDashboardData);

// Services
router.post('/services',      adminController.createService);
router.put('/services/:id',   adminController.updateService);
router.delete('/services/:id',adminController.deleteService);

// Barbers
router.post('/barbers',      adminController.createBarber);
router.put('/barbers/:id',   adminController.updateBarber);   // <- NOVO
router.delete('/barbers/:id',adminController.deleteBarber);

// Appointments
router.post('/appointments',       adminController.createAppointment); // <- NOVO (manual booking)
router.put('/appointments/:id',    adminController.updateAppointment);
router.delete('/appointments/:id', adminController.deleteAppointment);

// Discounts
router.post('/discounts',      adminController.createDiscount);
router.put('/discounts/:id',   adminController.updateDiscount);
router.delete('/discounts/:id',adminController.deleteDiscount);

// Hours
router.get('/hours',  adminController.getHours);   // <- NOVO
router.post('/hours', adminController.saveHours);  // <- NOVO

// Export CSV
router.get('/appointments/export', adminController.exportAppointmentsCSV);

module.exports = router;

