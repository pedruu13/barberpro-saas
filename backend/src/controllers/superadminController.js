const prisma = require('../lib/prisma');

exports.getAllShops = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        planStatus: true,
        trialEndsAt: true,
        planPaidUntil: true,
        createdAt: true,
        _count: {
          select: { barbers: true, appointments: true, services: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.updateShopPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, planStatus, planPaidUntil } = req.body;
    
    const data = {};
    if (plan !== undefined) data.plan = plan;
    if (planStatus !== undefined) data.planStatus = planStatus;
    // planPaidUntil expects an ISO string, e.g. "2024-12-31T23:59:59.000Z"
    if (planPaidUntil !== undefined) data.planPaidUntil = planPaidUntil ? new Date(planPaidUntil) : null;

    const shop = await prisma.shop.update({
      where: { id },
      data,
      select: { id: true, name: true, plan: true, planStatus: true, planPaidUntil: true }
    });
    
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.shop.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
