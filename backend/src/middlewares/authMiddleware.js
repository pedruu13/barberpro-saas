const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('❌ FATAL: JWT_SECRET não está definido nas variáveis de ambiente!');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Acesso negado. Token ausente.' });

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    
    try {
      const prisma = require('../lib/prisma');
      const shop = await prisma.shop.findUnique({ where: { id: user.shopId } });
      if (!shop) return res.status(401).json({ error: 'Conta não encontrada. Faça login novamente.' });
      
      req.user = user; // contains { shopId }
      req.shop = shop; // add full shop object for later use
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao validar sessão.' });
    }
  });
}

module.exports = { authenticate, JWT_SECRET };
