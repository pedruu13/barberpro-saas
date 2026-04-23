const prisma = require('../lib/prisma');

// ============================================================
// Shop Settings & Plan
// ============================================================
exports.getShopSettings = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.user.shopId },
      select: { id: true, name: true, address: true, email: true, mpAccessToken: true, zapiInstance: true, zapiToken: true }
    });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

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
    const [services, barbers, discounts, appointments, hours] = await Promise.all([
      prisma.service.findMany({ where: { shopId }, orderBy: { createdAt: 'asc' } }),
      prisma.barber.findMany({ where: { shopId }, orderBy: { createdAt: 'asc' } }),
      prisma.discount.findMany({ where: { shopId }, orderBy: { createdAt: 'desc' } }),
      prisma.appointment.findMany({ where: { shopId }, orderBy: { date: 'desc' } }),
      prisma.hours.findMany({ where: { shopId } })
    ]);

    // Busca também o nome da loja
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, slug: true } });

    res.json({ services, barbers, discounts, appointments, hours, shopName: shop?.name, shopSlug: shop?.slug });
  } catch (error) {
    console.error('getDashboardData error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// ============================================================
// Services
// ============================================================
exports.createService = async (req, res) => {
  try {
    const { name, price, duration, desc } = req.body;
    if (!name || !price || !duration) return res.status(400).json({ error: 'Campos obrigatórios: name, price, duration' });
    const newSvc = await prisma.service.create({
      data: { name: String(name), price: parseFloat(price), duration: parseInt(duration), desc: String(desc || ''), shopId: req.user.shopId }
    });
    res.json(newSvc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.updateService = async (req, res) => {
  try {
    const { name, price, duration, desc } = req.body;
    if (!name || !price || !duration) return res.status(400).json({ error: 'Campos obrigatórios: name, price, duration' });
    const updated = await prisma.service.updateMany({
      where: { id: req.params.id, shopId: req.user.shopId },
      data: { name: String(name), price: parseFloat(price), duration: parseInt(duration), desc: String(desc || '') }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Serviço não encontrado' });
    const svc = await prisma.service.findUnique({ where: { id: req.params.id } });
    res.json(svc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.deleteService = async (req, res) => {
  try {
    await prisma.service.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

// ============================================================
// Barbers
// ============================================================
exports.createBarber = async (req, res) => {
  try {
    const { name, role, emoji } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const newBarber = await prisma.barber.create({
      data: { name: String(name), role: String(role || 'Barbeiro'), emoji: String(emoji || '✂️'), shopId: req.user.shopId }
    });
    res.json(newBarber);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.updateBarber = async (req, res) => {
  try {
    const { name, role, emoji } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const updated = await prisma.barber.updateMany({
      where: { id: req.params.id, shopId: req.user.shopId },
      data: { name: String(name), role: String(role || 'Barbeiro'), emoji: String(emoji || '✂️') }
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Barbeiro não encontrado' });
    const barber = await prisma.barber.findUnique({ where: { id: req.params.id } });
    res.json(barber);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.deleteBarber = async (req, res) => {
  try {
    await prisma.barber.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

// ============================================================
// Appointments (Admin)
// ============================================================
exports.createAppointment = async (req, res) => {
  try {
    const { clientName, clientPhone, serviceNames, barberName, date, time, paymentMethod, price } = req.body;
    if (!clientName || !serviceNames || !barberName || !date || !time) {
      return res.status(400).json({ error: 'Campos obrigatórios: clientName, serviceNames, barberName, date, time' });
    }
    const newAppt = await prisma.appointment.create({
      data: {
        shopId: req.user.shopId,
        clientName: String(clientName),
        clientPhone: String(clientPhone || ''),
        serviceNames: String(serviceNames),
        barberName: String(barberName),
        date: String(date),
        time: String(time),
        status: 'confirmed',
        paymentStatus: 'pendente',
        paymentMethod: String(paymentMethod || 'Na barbearia'),
        price: parseFloat(price) || 0
      }
    });
    res.json(newAppt);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.updateAppointment = async (req, res) => {
  try {
    // Whitelist dos campos que podem ser atualizados
    const allowed = ['status', 'paymentStatus', 'paymentMethod', 'archived', 'price', 'clientName', 'clientPhone', 'barberName', 'serviceNames', 'date', 'time'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const updated = await prisma.appointment.updateMany({
      where: { id: req.params.id, shopId: req.user.shopId },
      data
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Agendamento não encontrado' });
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    res.json(appt);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.deleteAppointment = async (req, res) => {
  try {
    await prisma.appointment.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

// ============================================================
// Discounts / Cupons
// ============================================================
exports.createDiscount = async (req, res) => {
  try {
    const { code, type, value, desc } = req.body;
    if (!code || !value) return res.status(400).json({ error: 'Código e valor são obrigatórios' });
    const newDisc = await prisma.discount.create({
      data: {
        code: String(code).toUpperCase(),
        type: String(type || 'percent'),
        value: parseFloat(value),
        desc: String(desc || 'Desconto especial'),
        shopId: req.user.shopId,
        active: true,
        uses: 0
      }
    });
    res.json(newDisc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.updateDiscount = async (req, res) => {
  try {
    const allowed = ['code', 'type', 'value', 'desc', 'active'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const updated = await prisma.discount.updateMany({
      where: { id: req.params.id, shopId: req.user.shopId },
      data
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Cupom não encontrado' });
    const disc = await prisma.discount.findUnique({ where: { id: req.params.id } });
    res.json(disc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.deleteDiscount = async (req, res) => {
  try {
    await prisma.discount.deleteMany({ where: { id: req.params.id, shopId: req.user.shopId } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

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

exports.getHours = async (req, res) => {
  try {
    const hours = await prisma.hours.findMany({ where: { shopId: req.user.shopId } });
    // Se ainda não tem horários cadastrados, retorna os defaults
    if (hours.length === 0) return res.json(DEFAULT_HOURS.map(h => ({ ...h, id: null, shopId: req.user.shopId })));
    // Retorna ordenado pela sequência de dias
    const order = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    hours.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
    res.json(hours);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

exports.saveHours = async (req, res) => {
  try {
    const hoursData = req.body; // array de { day, open, start, end }
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
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

// ============================================================
// Export CSV — GET /api/admin/appointments/export?month=YYYY-MM
// ============================================================
exports.exportAppointmentsCSV = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { month } = req.query; // opcional, formato YYYY-MM

    let where = { shopId, archived: false };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      // Filtra agendamentos do mês: date começa com "YYYY-MM"
      where.date = { startsWith: month };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    });

    // Gera CSV
    const escape = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const header = ['Data', 'Hora', 'Cliente', 'Telefone', 'Serviço', 'Barbeiro', 'Valor (R$)', 'Pagamento', 'Status Pgto', 'Status'];
    const rows = appointments.map(a => [
      a.date, a.time, a.clientName, a.clientPhone,
      a.serviceNames, a.barberName,
      (a.price || 0).toFixed(2).replace('.', ','),
      a.paymentMethod, a.paymentStatus, a.status
    ].map(escape).join(','));

    const csv = '\uFEFF' + [header.map(escape).join(','), ...rows].join('\r\n'); // BOM para Excel

    const filename = month
      ? `agendamentos_${month}.csv`
      : `agendamentos_todos.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Erro no servidor' }); }
};

