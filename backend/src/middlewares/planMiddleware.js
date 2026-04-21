function requireActivePlan(req, res, next) {
  const shop = req.shop;

  if (!shop) {
    return res.status(401).json({ error: 'Conta não encontrada.' });
  }

  const now = new Date();

  // Check manual inactive status
  if (shop.planStatus !== 'active') {
    return res.status(403).json({ 
      error: 'Sua conta está inativa. Entre em contato com o suporte.' 
    });
  }

  // Check trial expiration
  if (shop.plan === 'trial') {
    if (shop.trialEndsAt && now > shop.trialEndsAt) {
      return res.status(402).json({ 
        error: 'Seu período de teste expirou. Atualize seu plano para continuar usando o sistema.' 
      });
    }
  }

  // Check paid plan expiration
  if (shop.plan !== 'trial') {
    if (shop.planPaidUntil && now > shop.planPaidUntil) {
      return res.status(402).json({ 
        error: 'Sua assinatura expirou. Renove seu plano para continuar usando o sistema.' 
      });
    }
  }

  next();
}

module.exports = { requireActivePlan };
