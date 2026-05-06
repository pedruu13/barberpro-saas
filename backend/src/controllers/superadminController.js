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
    const { plan, planStatus, planPaidUntil, trialEndsAt } = req.body;
    
    const data = {};
    if (plan !== undefined) data.plan = plan;
    if (planStatus !== undefined) data.planStatus = planStatus;
    if (planPaidUntil !== undefined) data.planPaidUntil = planPaidUntil ? new Date(planPaidUntil) : null;
    if (trialEndsAt !== undefined) data.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;

    const shop = await prisma.shop.update({
      where: { id },
      data,
      select: { id: true, name: true, plan: true, planStatus: true, planPaidUntil: true, trialEndsAt: true }
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

exports.getPlatformKPIs = async (req, res) => {
  try {
    const totalShops = await prisma.shop.count();
    const totalAppts = await prisma.appointment.count();
    
    // Simplificado: Soma de preços de todos agendamentos completados (simulando faturamento global)
    const result = await prisma.appointment.aggregate({
      where: { status: 'completed' },
      _sum: { price: true }
    });

    res.json({
      totalShops,
      totalAppts,
      totalRevenue: result._sum.price || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
