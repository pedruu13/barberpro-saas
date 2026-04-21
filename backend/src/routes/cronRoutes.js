const express = require('express');
const router = express.Router();
const { processReminders } = require('../jobs/scheduler');

// POST /api/cron/reminders
// Rota segura para disparar os cron jobs. O frontend não chama isso, apenas um serviço externo de Cron.
router.post('/reminders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    // Verificação de segurança: O serviço externo DEVE mandar o token via Header: Authorization: Bearer <SEGREDO>
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized CRON execution' });
    }

    const result = await processReminders();
    res.status(200).json(result);
  } catch (error) {
    console.error('Falha ao processar reminders via cron route', error);
    res.status(500).json({ error: 'Internal Server Error processing reminders' });
  }
});

module.exports = router;
