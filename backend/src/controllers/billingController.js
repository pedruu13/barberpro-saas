const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const prisma = require('../lib/prisma');
const asyncHandler = require('express-async-handler');
const logger = require('../lib/logger');

// Configuração do Mercado Pago com o Token Mestre da Plataforma
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_MASTER_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN 
});

/**
 * Gera um link de pagamento para a assinatura do SaaS (R$ 150,00)
 */
exports.createSubscriptionLink = asyncHandler(async (req, res) => {
  const shopId = req.user.shopId;
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  const preference = new Preference(client);
  const result = await preference.create({
    body: {
      items: [
        {
          id: 'subscription-monthly',
          title: 'Assinatura Mensal BarberPro SaaS',
          quantity: 1,
          unit_price: 150.00,
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: shop.email,
        name: shop.name
      },
      external_reference: shopId, // CRITICAL: Link payment to shopId
      back_urls: {
        success: `${process.env.FRONTEND_URL}/admin?payment=success`,
        failure: `${process.env.FRONTEND_URL}/admin?payment=failure`
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_PUBLIC_URL || 'https://sua-api.vercel.app'}/api/public/billing/webhook/mp`
    }
  });

  res.json({ init_point: result.init_point });
});

/**
 * Webhook para receber notificações do Mercado Pago
 */
exports.handleWebhook = asyncHandler(async (req, res) => {
  const { type, data } = req.body;

  // Processamos apenas notificações de pagamento
  if (type === 'payment') {
    const paymentId = data.id;
    const payment = new Payment(client);
    
    const paymentInfo = await payment.get({ id: paymentId });

    if (paymentInfo.status === 'approved') {
      const shopId = paymentInfo.external_reference;
      
      if (!shopId) {
        logger.error({ paymentId }, '[Webhook MP] Pagamento aprovado mas external_reference (shopId) ausente.');
        return res.status(400).send('Missing external_reference');
      }

      // Calcula a nova data de expiração (+30 dias a partir de hoje ou da expiração atual)
      const currentShop = await prisma.shop.findUnique({ where: { id: shopId } });
      const now = new Date();
      let newDate = new Date();

      if (currentShop.planPaidUntil && currentShop.planPaidUntil > now) {
        newDate = new Date(currentShop.planPaidUntil);
      }
      newDate.setDate(newDate.getDate() + 30);

      await prisma.shop.update({
        where: { id: shopId },
        data: {
          planPaidUntil: newDate,
          planStatus: 'active',
          plan: 'basic' // Ou o plano correspondente ao valor
        }
      });

      logger.info({ shopId, paymentId }, '[Webhook MP] ✅ Plano renovado automaticamente');
    }
  }

  res.status(200).send('OK');
});
