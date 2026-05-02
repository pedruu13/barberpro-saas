const prisma = require('../lib/prisma');
const asyncHandler = require('express-async-handler');
const { startOfMonth, startOfDay, subDays, format } = require('date-fns');

/**
 * Retorna os dados agregados para os gráficos do Dashboard Admin.
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const thirtyDaysAgo = subDays(new Date(), 30);

  // 1. Faturamento dos últimos 30 dias (Agrupado por dia)
  const appointments = await prisma.appointment.findMany({
    where: {
      shopId,
      status: 'completed', // Apenas cortes finalizados
      createdAt: { gte: thirtyDaysAgo }
    },
    select: {
      price: true,
      createdAt: true
    }
  });

  const dailyRevenue = {};
  // Inicializa os últimos 30 dias com 0
  for (let i = 0; i <= 30; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    dailyRevenue[d] = 0;
  }

  appointments.forEach(appt => {
    const day = format(new Date(appt.createdAt), 'yyyy-MM-dd');
    if (dailyRevenue[day] !== undefined) {
      dailyRevenue[day] += Number(appt.price) || 0;
    }
  });

  const revenueChart = Object.keys(dailyRevenue).sort().map(day => ({
    day: format(new Date(day), 'dd/MM'),
    value: dailyRevenue[day]
  }));

  // 2. Serviços mais populares
  const serviceStats = await prisma.appointment.groupBy({
    by: ['serviceNames'],
    where: { shopId, status: 'completed' },
    _count: { serviceNames: true },
    orderBy: { _count: { serviceNames: 'desc' } },
    take: 5
  });

  // 3. Desempenho por Barbeiro
  const barberStats = await prisma.appointment.groupBy({
    by: ['barberName'],
    where: { shopId, status: 'completed' },
    _sum: { price: true, commissionValue: true },
    _count: { id: true }
  });

  res.json({
    revenueChart,
    topServices: serviceStats.map(s => ({ name: s.serviceNames, count: s._count.serviceNames })),
    barberPerformance: barberStats.map(b => ({
      name: b.barberName,
      revenue: Number(b._sum.price) || 0,
      commission: Number(b._sum.commissionValue) || 0,
      count: b._count.id
    }))
  });
});
