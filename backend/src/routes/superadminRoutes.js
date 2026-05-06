const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');

const { authenticate, authorizeSupremo } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorizeSupremo);

router.get('/shops', superadminController.getAllShops);
router.get('/analytics', superadminController.getPlatformKPIs);
router.put('/shops/:id/plan', superadminController.updateShopPlan);
router.delete('/shops/:id', superadminController.deleteShop);

module.exports = router;
