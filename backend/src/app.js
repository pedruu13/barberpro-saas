require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes   = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes  = require('./routes/adminRoutes');
const superadminRoutes = require('./routes/superadminRoutes');
const { authenticate } = require('./middlewares/authMiddleware');

const app = express();

// Confia no proxy da Vercel para o express-rate-limit funcionar corretamente
app.set('trust proxy', 1);

// CORS — permite origens do .env + localhost:3000 (para o servidor servir o próprio frontend)
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || 'http://127.0.0.1:5500,http://localhost:5500').split(','),
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].map(s => s.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Permite: sem origin (Postman), domínios permitidos, localhost ou qualquer subdomínio .vercel.app
    const isVercel = origin && origin.endsWith('.vercel.app');
    if (!origin || origin === 'null' || allowedOrigins.includes(origin) || isVercel) return callback(null, true);
    callback(new Error('CORS: origem não permitida — ' + origin));
  },
  credentials: true
}));
app.use(express.json());

// ─── Arquivos estáticos do frontend ───────────────────────────────────────────
// Acesse: http://localhost:3000           → landing / admin
// Acesse: http://localhost:3000?shop=<id> → booking público da barbearia
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));
// ──────────────────────────────────────────────────────────────────────────────

// API Routes
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Muitas tentativas de login/registro. Tente novamente em 15 minutos.' } });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin',  authenticate, adminRoutes);
app.use('/api/superadmin', superadminRoutes);

// Vercel Cron Trigger Route (Protegida)
const cronRoutes = require('./routes/cronRoutes');
app.use('/api/cron', cronRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Fallback: rotas não-API → devolve o HTML principal (SPA fallback)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'barbearia-saas.html'));
  } else {
    next();
  }
});

module.exports = app;
