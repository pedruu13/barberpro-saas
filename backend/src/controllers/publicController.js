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
      services: shop.services,
      barbers:  shop.barbers,
      discounts: shop.discounts,
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

    // ─── Validação de conflito de horário no backend ──────────────────────────
    const conflict = await prisma.appointment.findFirst({
      where: {
        shopId: String(shopId),
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

    const newAppt = await prisma.appointment.create({
      data: {
        shopId: String(shopId),
        clientName: String(clientName),
        clientPhone: String(clientPhone || ''),
        serviceNames: String(serviceNames),
        barberName: String(barberName),
        date: String(date),
        time: String(time),
        status: 'pending',
        paymentStatus: 'pendente',
        paymentMethod: String(paymentMethod || 'Na barbearia'),
        price: parseFloat(price) || 0
      }
    });

    // Busca dados da barbearia (para MP e Z-API)
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return res.status(404).json({ error: 'Barbearia não encontrada no novo banco de dados. Crie uma nova conta para testar.' });
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
