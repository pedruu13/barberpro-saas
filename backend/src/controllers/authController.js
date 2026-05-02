const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const { getDefaultShopData } = require('../lib/seedDefaults');

// Validação
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  
  const existing = await prisma.shop.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: 'Email já cadastrado.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);
  
  // Período de teste de 14 dias
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  // Gerar slug amigável e único
  const baseSlug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const hash = Math.random().toString(36).substring(2, 6);
  const slug = `${baseSlug}-${hash}`;

  // Dados iniciais (Onboarding)
  const seedData = getDefaultShopData();

  // Create new shop/tenant com dados iniciais
  const shop = await prisma.shop.create({
    data: {
      name,
      slug,
      email,
      password: hashedPassword,
      trialEndsAt,
      ...seedData
    }
  });

  const token = jwt.sign({ shopId: shop.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, shopId: shop.id, name: shop.name });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  
  const shop = await prisma.shop.findUnique({ where: { email } });
  if (!shop || !bcrypt.compareSync(password, shop.password)) {
    return res.status(401).json({ error: 'Email ou senha incorretos.' });
  }

  const token = jwt.sign({ shopId: shop.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, shopId: shop.id, name: shop.name });
});
