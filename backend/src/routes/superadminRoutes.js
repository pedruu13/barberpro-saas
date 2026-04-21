const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');

// Super Admin Middleware using an environment variable
function requireSuperadmin(req, res, next) {
  const adminKey = req.headers['x-superadmin-key'];
  if (!process.env.SUPERADMIN_KEY || adminKey !== process.env.SUPERADMIN_KEY) {
    return res.status(403).json({ error: 'Acesso negado ao Super Admin.' });
  }
  next();
}

router.use(requireSuperadmin);

router.get('/shops', superadminController.getAllShops);
router.put('/shops/:id/plan', superadminController.updateShopPlan);
router.delete('/shops/:id', superadminController.deleteShop);

module.exports = router;
