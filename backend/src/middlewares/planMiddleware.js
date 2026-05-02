const logger = require('../lib/logger');

function requireActivePlan(req, res, next) {
  const shop = req.shop;

  if (!shop) {
    logger.warn({ path: req.path }, 'Tentativa de acesso sem dados da loja (req.shop)');
    return res.status(401).json({ error: 'Conta não encontrada ou não autenticada corretamente.' });
  }

  const now = new Date();

  // 1. Verificação de status manual (inativo pelo admin do SaaS)
  if (shop.planStatus !== 'active') {
    return res.status(403).json({ 
      error: 'Sua conta está inativa. Entre em contato com o suporte.' 
    });
  }

  // 2. Verificação de período de teste
  if (shop.plan === 'trial') {
    if (shop.trialEndsAt && now > new Date(shop.trialEndsAt)) {
      // Implementação de "carência" (opcional): se quiser dar +1 dia, adicione aqui
      return res.status(402).json({ 
        error: 'Seu período de teste expirou. Atualize seu plano para continuar usando o sistema.' 
      });
    }
  }

  // 3. Verificação de plano pago
  if (shop.plan !== 'trial') {
    if (shop.planPaidUntil && now > new Date(shop.planPaidUntil)) {
      return res.status(402).json({ 
        error: 'Sua assinatura expirou. Renove seu plano para continuar usando o sistema.' 
      });
    }
  }

  next();
}

module.exports = { requireActivePlan };
