const prisma = require('../lib/prisma');

const  requireActivePlan = async (req, res, next) => {
  try {
    const shopId = req.user.shopId;
    if (!shopId) return res.status(401).json({ error: 'Não autorizado' });

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { plan: true, planStatus: true, trialEndsAt: true, planPaidUntil: true }
    });

    if (!shop) return res.status(404).json({ error: 'Shop não encontrado' });

    const now = new Date();

    let isAccessValid = false;

    if (shop.plan === 'trial') {
      if (shop.trialEndsAt && new Date(shop.trialEndsAt) > now) {
        isAccessValid = true;
      }
    } else {
      if (shop.planStatus === 'active' && shop.planPaidUntil && new Date(shop.planPaidUntil) > now) {
        isAccessValid = true;
      }
    }

    if (!isAccessValid) {
      return res.status(402).json({ error: 'PAYWALL', message: 'Seu plano expirou. Por favor, assine para continuar usando as ferramentas.' });
    }

    next();
  } catch (error) {
    console.error('requireActivePlan error:', error);
    res.status(500).json({ error: 'Erro no servidor interno' });
  }
};

module.exports = { requireActivePlan };
