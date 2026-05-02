const prisma = require('../lib/prisma');
const paymentService = require('../services/paymentService');
const notificationService = require('../services/notificationService');

exports.getShopInfo = async (req, res) => {
  try {
    const searchParam = req.params.shopId;
    const shop = await prisma.shop.findFirst({
      where: { OR: [{ id: searchParam }, { slug: searchParam }] },
      include: {
        services: { orderBy: { createdAt: 'asc' } },
        barbers:  { orderBy: { createdAt: 'asc' } },
        discounts: { where: { active: true } },
        subscriptionPlans: true,
        hours: true
      }
    });

    if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

    // Ordena horários por dia da semana
    const order = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const hours = (shop.hours || []).sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));

    res.json({
      shopId: shop.id,
      shopSlug: shop.slug,
      shopName: shop.name,
      shopAddress: shop.address,
      pixKey: shop.pixKey,
      services: shop.services,
      barbers:  shop.barbers,
      discounts: shop.discounts,
      plans: shop.subscriptionPlans,
      hours
    });
  } catch (error) {
    console.error('getShopInfo error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { shopId, clientName, clientPhone, serviceNames, barberName, date, time, paymentMethod, price } = req.body;

    if (!shopId) return res.status(400).json({ error: 'ID da barbearia não identificado.' });
    if (!clientName) return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
    if (!serviceNames) return res.status(400).json({ error: 'Selecione ao menos um serviço.' });
    if (!barberName) return res.status(400).json({ error: 'Selecione um barbeiro.' });
    if (!date || !time) return res.status(400).json({ error: 'Data e horário são obrigatórios.' });

    // ─── Resolver Shop por ID ou Slug ─────────────────────────────────────────
    const shop = await prisma.shop.findFirst({
      where: { OR: [{ id: String(shopId) }, { slug: String(shopId) }] }
    });

    if (!shop) {
      return res.status(404).json({ error: 'Barbearia não encontrada. Verifique o link.' });
    }
    const actualShopId = shop.id;
    // ──────────────────────────────────────────────────────────────────────────

    // ─── Validação de conflito de horário no backend ──────────────────────────
    const conflict = await prisma.appointment.findFirst({
      where: {
        shopId: actualShopId,
        barberName: String(barberName),
        date: String(date),
        time: String(time),
        archived: false,
        status: { in: ['pending', 'confirmed'] }
      }
    });
    if (conflict) {
      return res.status(409).json({ error: `Horário ${time} já está ocupado para ${barberName}. Escolha outro horário.` });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Buscar a comissão do barbeiro e verificar Clube de Assinatura
    let commissionValue = 0;
    const barber = await prisma.barber.findFirst({
      where: { shopId: actualShopId, name: String(barberName) }
    });
    
    let finalPrice = parseFloat(price) || 0;
    let finalPaymentMethod = String(paymentMethod || 'Na barbearia');
    let usingPlan = String(serviceNames).includes('⭐ Usar Plano');
    let fullyPaidByPlan = false;

    if (clientPhone) {
      const clientRecord = await prisma.client.findUnique({
        where: { shopId_phone: { shopId: actualShopId, phone: String(clientPhone) } },
        include: { plan: true }
      });
      
      if (usingPlan && clientRecord && clientRecord.plan && clientRecord.planExpiresAt && new Date(clientRecord.planExpiresAt) > new Date()) {
        if (clientRecord.cutsUsed < clientRecord.plan.maxCuts) {
          if (finalPrice <= 0) {
            finalPaymentMethod = 'Clube do Barbeiro';
            fullyPaidByPlan = true;
          }
          await prisma.client.update({
            where: { id: clientRecord.id },
            data: { cutsUsed: { increment: 1 } }
          });
        }
      }
    }

    if (barber && barber.commissionPct > 0) {
      commissionValue = finalPrice * (barber.commissionPct / 100);
    }

    const newAppt = await prisma.appointment.create({
      data: {
        shopId: actualShopId,
        clientName: String(clientName),
        clientPhone: String(clientPhone || ''),
        serviceNames: String(serviceNames),
        barberName: String(barberName),
        date: String(date),
        time: String(time),
        status: 'pending',
        paymentStatus: fullyPaidByPlan ? 'pago' : 'pendente',
        paymentMethod: finalPaymentMethod,
        price: finalPrice,
        commissionValue
      }
    });

    // Atualizar CRM de Cliente (assíncrono para não bloquear)
    if (clientPhone) {
      prisma.client.upsert({
        where: { shopId_phone: { shopId: actualShopId, phone: String(clientPhone) } },
        update: {
          name: String(clientName),
          totalVisits: { increment: 1 },
          totalSpent: { increment: finalPrice }
        },
        create: {
          shopId: actualShopId,
          name: String(clientName),
          phone: String(clientPhone),
          totalVisits: 1,
          totalSpent: finalPrice
        }
      }).catch(e => console.error('CRM Update Error:', e));
    }

    // Tenta pagamento online (Mercado Pago)
    if (paymentMethod === 'Pix Antecipado' || paymentMethod === 'Cartão de Crédito') {
      const preference = await paymentService.createPixPaymentPreference(shop, newAppt, parseFloat(price) || 0);
      if (preference) {
        newAppt.paymentUrl = preference.init_point;
      }
    }

    // Notificação WhatsApp via Z-API (usa credenciais da barbearia ou env global)
    notificationService.sendWhatsAppMessage(
      clientPhone,
      `Olá ${clientName}! ✅ Agendamento confirmado:\n✂️ ${serviceNames}\n📅 ${date} às ${time}\nBarbeiro: ${barberName}\n💰 Total: R$${(parseFloat(price) || 0).toFixed(2)}`,
      shop
    ).catch(e => console.error('WhatsApp notification error:', e));

    res.json({ success: true, appointment: newAppt });
  } catch (error) {
    console.error('createAppointment error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

// Horários ocupados para um dia específico (usado pelo booking frontend)
exports.getBusySlots = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { date } = req.query;

    if (!date) return res.status(400).json({ error: 'Parâmetro date é obrigatório (YYYY-MM-DD)' });

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        date,
        archived: false,
        status: { in: ['pending', 'confirmed'] }
      },
      select: { time: true }
    });

    const busySlots = appointments.map(a => a.time);
    res.json({ busySlots });
  } catch (error) {
    console.error('getBusySlots error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.getClientAppointments = async (req, res) => {
  try {
    const { phone } = req.params;
    const { shopId } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'phone num é obrigatório.' });
    }

    const whereClause = { clientPhone: String(phone) };
    if (shopId && shopId !== 'null' && shopId !== 'undefined') {
      whereClause.shopId = String(shopId);
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: { shop: { select: { name: true } } },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    res.json(appointments);
  } catch (error) {
    console.error('getClientAppointments error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.cancelClientAppointment = async (req, res) => {
  try {
    const { phone, appointmentId } = req.body;

    if (!phone || !appointmentId) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: String(appointmentId),
        clientPhone: String(phone),
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado para este telefone.' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Agendamento já está cancelado.' });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'cancelled' }
    });

    res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('cancelClientAppointment error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

exports.clientRegister = async (req, res) => {
  try {
    const { shopId, name, phone, password } = req.body;
    if (!shopId || !name || !phone || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

    let client = await prisma.client.findUnique({
      where: { shopId_phone: { shopId, phone } }
    });

    if (client) {
      if (client.password) return res.status(400).json({ error: 'Telefone já cadastrado com senha. Faça login.' });
      // Se não tinha senha (era um cliente de agendamento antigo), atualiza com a senha
      client = await prisma.client.update({
        where: { id: client.id },
        data: { name, password: bcrypt.hashSync(password, 8) }
      });
    } else {
      client = await prisma.client.create({
        data: {
          shopId,
          name,
          phone,
          password: bcrypt.hashSync(password, 8)
        }
      });
    }

    const token = jwt.sign({ clientId: client.id, shopId: client.shopId, role: 'client' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, client: { id: client.id, name: client.name, phone: client.phone } });
  } catch (error) {
    console.error('Client Register Error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.clientLogin = async (req, res) => {
  try {
    const { shopId, phone, password } = req.body;
    if (!shopId || !phone || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

    const client = await prisma.client.findUnique({
      where: { shopId_phone: { shopId, phone } },
      include: { plan: true }
    });

    if (!client || !client.password || !bcrypt.compareSync(password, client.password)) {
      return res.status(401).json({ error: 'Telefone ou senha incorretos' });
    }

    const token = jwt.sign({ clientId: client.id, shopId: client.shopId, role: 'client' }, JWT_SECRET, { expiresIn: '30d' });
    
    // Calcula cota do plano
    let planInfo = null;
    if (client.planId && client.planExpiresAt && new Date(client.planExpiresAt) > new Date()) {
      planInfo = {
        name: client.plan.name,
        maxCuts: client.plan.maxCuts,
        cutsUsed: client.cutsUsed,
        expiresAt: client.planExpiresAt,
        isActive: true
      };
    } else if (client.planId) {
       planInfo = { isActive: false, reason: 'expirado' };
    }

    res.json({ token, client: { id: client.id, name: client.name, phone: client.phone, planInfo } });
  } catch (error) {
    console.error('Client Login Error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.subscribePlan = async (req, res) => {
  try {
    const { shopId, phone, planId } = req.body;
    if (!shopId || !phone || !planId) return res.status(400).json({ error: 'Faltam dados para assinatura' });

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.shopId !== shopId) return res.status(404).json({ error: 'Plano não encontrado' });

    const client = await prisma.client.findUnique({ where: { shopId_phone: { shopId, phone } } });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

    // Calcula validade para +30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: {
        planId: plan.id,
        cutsUsed: 0,
        planExpiresAt: expiresAt
      }
    });

    res.json({ success: true, planInfo: { name: plan.name, maxCuts: plan.maxCuts, cutsUsed: 0, expiresAt, isActive: true } });
  } catch (error) {
    console.error('Subscribe Plan Error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
