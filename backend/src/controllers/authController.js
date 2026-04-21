const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existing = await prisma.shop.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    
    // Set 14-day trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Gerar slug amigável e único
    const baseSlug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const hash = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${hash}`;

    // Create new shop/tenant
    const shop = await prisma.shop.create({
      data: {
        name,
        slug,
        email,
        password: hashedPassword,
        trialEndsAt,
        services: {
          create: [
            { name: 'Corte Simples', price: 30, duration: 30, desc: 'Serviço rápido' }
          ]
        },
        barbers: {
          create: [
            { name: 'Barbeiro Local', role: 'Geral', emoji: '✂️' }
          ]
        }
      }
    });

    const token = jwt.sign({ shopId: shop.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, shopId: shop.id, name: shop.name });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const shop = await prisma.shop.findUnique({ where: { email } });
    if (!shop || !bcrypt.compareSync(password, shop.password)) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const token = jwt.sign({ shopId: shop.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, shopId: shop.id, name: shop.name });
  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
};
