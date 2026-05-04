const prisma = require('../lib/prisma');
const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const logger = require('../lib/logger');

// Schemas de Validação
const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().or(z.string().transform(v => parseFloat(v))).refine(n => n >= 0, 'Preço deve ser positivo'),
  duration: z.number().int().or(z.string().transform(v => parseInt(v))).refine(n => n > 0, 'Duração deve ser maior que 0'),
  desc: z.string().optional().default(''),
  category: z.string().optional().default(''),
});

const barberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.string().optional().default('Barbeiro'),
  emoji: z.string().optional().default('✂️'),
  commissionPct: z.number().min(0).max(100).or(z.string().transform(v => parseFloat(v || 0))).default(0),
  pixKey: z.string().optional().nullable().default(null),
});


// ============================================================
// Shop Settings & Plan
// ============================================================
exports.getShopSettings = asyncHandler(async (req, res) => {
  const shop = await prisma.shop.findUnique({
    where: { id: req.user.shopId },
    select: { id: true, name: true, address: true, email: true, mpAccessToken: true, zapiInstance: true, zapiToken: true, pixKey: true }
  });
  res.json(shop);
});


exports.updateShopSettings = async (req, res) => {
  try {
    const { name, address, email, password, mpAccessToken, zapiInstance, zapiToken } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (email) updateData.email = email;
    if (mpAccessToken !== undefined) updateData.mpAccessToken = mpAccessToken;
    if (zapiInstance !== undefined) updateData.zapiInstance = zapiInstance;
    if (zapiToken !== undefined) updateData.zapiToken = zapiToken;
    if (req.body.pixKey !== undefined) updateData.pixKey = req.body.pixKey;
    
    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password = bcrypt.hashSync(password, 8);
    }

    const updated = await prisma.shop.update({
      where: { id: req.user.shopId },
      data: updateData,
      select: { id: true, name: true, email: true }
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Email já está em uso.' });
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.getPlanStatus = (req, res) => {
  // Uses data injected by authMiddleware
  const { plan, planStatus, trialEndsAt, planPaidUntil } = req.shop;
  res.json({
    plan,
    status: planStatus,
    trialEndsAt,
    planPaidUntil,
    isTrialActive: plan === 'trial' && new Date() < new Date(trialEndsAt),
    isPlanActive: plan !== 'trial' && new Date() < new Date(planPaidUntil)
  });
};

// ============================================================
// Dashboard — carrega todos os dados de uma vez no login
// ============================================================
exports.getDashboardData = async (req, res) => {
  const shopId = req.user.shopId;
  try {
    const [services, barbers, discounts, appointments, hours, blocks, expenses, clients, plans] = await Promise.all([
      prisma.service.findMany({ where: { shopId }, orderBy: { createdAt: 'asc' } }),
      prisma.barber.findMany({ where: { shopId }, orderBy: { createdAt: 'asc' } }),
      prisma.discount.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } }),
      prisma.appointment.findMany({ where: { shopId }, orderBy: { date: 'desc' } }),
      prisma.hours.findMany({ where: { shopId } }),
      prisma.blockTime.findMany({ where: { shopId } }),
      prisma.expense.findMany({ where: { shopId }, orderBy: { date: 'desc' } }),
      prisma.client.findMany({ where: { shopId }, orderBy: { name: 'asc' }, include: { plan: true } }),
      prisma.subscriptionPlan.findMany({ where: { shopId }, orderBy: { price: 'asc' } })
    ]);

    // Busca também o nome da loja
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, slug: true } });

    res.json({ services, barbers, discounts, appointments, hours, blocks, expenses, clients, plans, shopName: shop?.name, shopSlug: shop?.slug });
  } catch (error) {
    console.error('getDashboardData error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ============================================================
// Services
// ============================================================
exports.createService = asyncHandler(async (req, res) => {
  const data = serviceSchema.parse(req.body);
  const newSvc = await prisma.service.create({
    data: { ...data, shopId: req.user.shopId }
  });
  logger.info({ shopId: req.user.shopId, serviceId: newSvc.id }, 'Serviço criado');
  res.json(newSvc);
});


exports.updateService = asyncHandler(async (req, res) => {
  const data = serviceSchema.parse(req.body);
  const { id } = req.params;
  
  const updated = await prisma.service.updateMany({
    where: { id, shopId: req.user.shopId },
    data
  });
  
  if (updated.count === 0) return res.status(404).json({ error: 'Serviço não encontrado' });
  const svc = await prisma.service.findUnique({ where: { id } });
  res.json(svc);
});

exports.deleteService = asyncHandler(async (req, res) => {
  await prisma.service.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
  res.json({ success: true });
});

// ============================================================
// Barbers
// ============================================================
exports.createBarber = asyncHandler(async (req, res) => {
  const data = barberSchema.parse(req.body);
  const newBarber = await prisma.barber.create({
    data: { ...data, shopId: req.user.shopId }
  });
  res.json(newBarber);
});

exports.updateBarber = asyncHandler(async (req, res) => {
  const data = barberSchema.parse(req.body);
  const { id } = req.params;

  const updated = await prisma.barber.updateMany({
    where: { id, shopId: req.user.shopId },
    data
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Barbeiro não encontrado' });
  const barber = await prisma.barber.findUnique({ where: { id } });
  res.json(barber);
});

exports.deleteBarber = asyncHandler(async (req, res) => {
  await prisma.barber.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
  res.json({ success: true });
});

// ============================================================
// Appointments (Admin)
// ============================================================
const appointmentSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().optional().default(''),
  serviceNames: z.string().min(1),
  barberName: z.string().min(1),
  date: z.string(),
  time: z.string(),
  paymentMethod: z.string().optional().default('Na barbearia'),
  price: z.number().or(z.string().transform(v => parseFloat(v))).default(0),
});

exports.createAppointment = asyncHandler(async (req, res) => {
  const data = appointmentSchema.parse(req.body);
  
  // Buscar a comissão do barbeiro
  let commissionValue = 0;
  const barber = await prisma.barber.findFirst({
    where: { shopId: req.user.shopId, name: data.barberName }
  });
  
  if (barber && barber.commissionPct > 0) {
    commissionValue = data.price * (barber.commissionPct / 100);
  }

  const newAppt = await prisma.appointment.create({
    data: {
      ...data,
      shopId: req.user.shopId,
      status: 'confirmed',
      paymentStatus: 'pendente',
      commissionValue
    }
  });

  if (data.clientPhone) {
    prisma.client.upsert({
      where: { shopId_phone: { shopId: req.user.shopId, phone: data.clientPhone } },
      update: {
        name: data.clientName,
        totalVisits: { increment: 1 },
        totalSpent: { increment: data.price }
      },
      create: {
        shopId: req.user.shopId,
        name: data.clientName,
        phone: data.clientPhone,
        totalVisits: 1,
        totalSpent: data.price
      }
    }).catch(e => logger.error({ err: e }, 'CRM Update Error'));
  }
  res.json(newAppt);
});

exports.updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Whitelist manual or partial schema
  const updated = await prisma.appointment.updateMany({
    where: { id, shopId: req.user.shopId },
    data: req.body // In a real app, use a schema here too
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Agendamento não encontrado' });
  const appt = await prisma.appointment.findFirst({ where: { id, shopId: req.user.shopId } });
  res.json(appt);
});

exports.deleteAppointment = asyncHandler(async (req, res) => {
  await prisma.appointment.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
  res.json({ success: true });
});

// ============================================================
// Discounts / Cupons
// ============================================================
const discountSchema = z.object({
  code: z.string().min(1).transform(v => v.toUpperCase()),
  type: z.enum(['percent', 'fixed']).default('percent'),
  value: z.number().or(z.string().transform(v => parseFloat(v))),
  desc: z.string().optional().default('Desconto especial'),
});

exports.createDiscount = asyncHandler(async (req, res) => {
  const data = discountSchema.parse(req.body);
  const newDisc = await prisma.discount.create({
    data: {
      ...data,
      shopId: req.user.shopId,
      active: true,
      uses: 0
    }
  });
  res.json(newDisc);
});

exports.updateDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.discount.updateMany({
    where: { id, shopId: req.user.shopId },
    data: req.body
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Cupom não encontrado' });
  const disc = await prisma.discount.findUnique({ where: { id } });
  res.json(disc);
});

exports.deleteDiscount = asyncHandler(async (req, res) => {
  await prisma.discount.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
  res.json({ success: true });
});

// ============================================================
// Hours — horários de funcionamento
// ============================================================
const DEFAULT_HOURS = [
  { day: 'Segunda', open: true, start: '08:00', end: '20:00' },
  { day: 'Terça',   open: true, start: '08:00', end: '20:00' },
  { day: 'Quarta',  open: true, start: '08:00', end: '20:00' },
  { day: 'Quinta',  open: true, start: '08:00', end: '20:00' },
  { day: 'Sexta',   open: true, start: '08:00', end: '21:00' },
  { day: 'Sábado',  open: true, start: '08:00', end: '18:00' },
  { day: 'Domingo', open: false, start: '09:00', end: '14:00' }
];

exports.getHours = asyncHandler(async (req, res) => {
  const hours = await prisma.hours.findMany({ where: { shopId: req.user.shopId } });
  if (hours.length === 0) return res.json(DEFAULT_HOURS.map(h => ({ ...h, id: null, shopId: req.user.shopId })));
  const order = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  hours.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
  res.json(hours);
});

exports.saveHours = asyncHandler(async (req, res) => {
  const hoursData = req.body;
  if (!Array.isArray(hoursData)) return res.status(400).json({ error: 'Formato inválido: espera array' });
  const shopId = req.user.shopId;

  const results = await Promise.all(
    hoursData.map(h =>
      prisma.hours.upsert({
        where: { shopId_day: { shopId, day: h.day } },
        update: { open: Boolean(h.open), start: String(h.start), end: String(h.end) },
        create: { shopId, day: String(h.day), open: Boolean(h.open), start: String(h.start), end: String(h.end) }
      })
    )
  );
  res.json(results);
});

// ============================================================
// Export CSV
// ============================================================
exports.exportAppointmentsCSV = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const { month } = req.query;

  let where = { shopId, archived: false };
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    where.date = { startsWith: month };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: 'asc' }, { time: 'asc' }]
  });

  const escape = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const header = ['Data', 'Hora', 'Cliente', 'Telefone', 'Serviço', 'Barbeiro', 'Valor (R$)', 'Pagamento', 'Status Pgto', 'Status'];
  const rows = appointments.map(a => [
    a.date, a.time, a.clientName, a.clientPhone,
    a.serviceNames, a.barberName,
    (Number(a.price) || 0).toFixed(2).replace('.', ','),
    a.paymentMethod, a.paymentStatus, a.status
  ].map(escape).join(','));

  const csv = '\uFEFF' + [header.map(escape).join(','), ...rows].join('\r\n');

  const filename = month ? `agendamentos_${month}.csv` : `agendamentos_todos.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// ============================================================
// Block Time
// ============================================================
exports.createBlockTime = asyncHandler(async (req, res) => {
  const { barberName, date, startTime, endTime, reason } = req.body;
  if (!barberName || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Campos obrigatórios: barberName, date, startTime, endTime' });
  }
  const newBlock = await prisma.blockTime.create({
    data: {
      shopId: req.user.shopId,
      barberName: String(barberName),
      date: new Date(date), // Usando Date real se possível
      startTime: String(startTime),
      endTime: String(endTime),
      reason: reason ? String(reason) : null
    }
  });
  res.json(newBlock);
});

exports.deleteBlockTime = asyncHandler(async (req, res) => {
  await prisma.blockTime.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
  res.json({ success: true });
});

// ============================================================
// Subscription Plans
// ============================================================
exports.createSubscriptionPlan = asyncHandler(async (req, res) => {
  const { name, price, maxCuts } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
  const newPlan = await prisma.subscriptionPlan.create({
    data: {
      shopId: req.user.shopId,
      name: String(name),
      price: Number(price),
      maxCuts: parseInt(maxCuts) || 4
    }
  });
  res.json(newPlan);
});

exports.updateSubscriptionPlan = asyncHandler(async (req, res) => {
  const { name, price, maxCuts, active } = req.body;
  const { id } = req.params;
  const updated = await prisma.subscriptionPlan.updateMany({
    where: { id, shopId: req.user.shopId },
    data: { name: String(name), price: Number(price), maxCuts: parseInt(maxCuts), active: Boolean(active) }
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Plano não encontrado' });
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  res.json(plan);
});

exports.deleteSubscriptionPlan = asyncHandler(async (req, res) => {
  await prisma.subscriptionPlan.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
  res.json({ success: true });
});

exports.assignPlanToClient = asyncHandler(async (req, res) => {
  const { clientId, planId } = req.body;
  if (!clientId) return res.status(400).json({ error: 'ID do cliente obrigatório' });
  
  let planExpiresAt = null;
  if (planId) {
    planExpiresAt = new Date();
    planExpiresAt.setDate(planExpiresAt.getDate() + 30);
  }

  await prisma.client.updateMany({
    where: { id: clientId, shopId: req.user.shopId },
    data: { planId: planId || null, planExpiresAt, cutsUsed: 0 }
  });

  res.json({ success: true });
});

exports.updateClientCuts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cutsUsed } = req.body;
  if (cutsUsed === undefined) return res.status(400).json({ error: 'Campo cutsUsed é obrigatório' });

  await prisma.client.updateMany({
    where: { id, shopId: req.user.shopId },
    data: { cutsUsed: Math.max(0, parseInt(cutsUsed)) }
  });

  res.json({ success: true });
});

