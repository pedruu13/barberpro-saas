const prisma = require('../lib/prisma');
const notificationService = require('../services/notificationService');
const logger = require('../lib/logger');
const { parse, addHours, isWithinInterval, isAfter } = require('date-fns');

/**
 * Processa os lembretes de pré-agendamento (Anti No-Show).
 * Verifica agendamentos nas próximas 2 horas.
 */
async function processReminders() {
  logger.info('[SCHEDULER] Iniciando processamento de lembretes...');
  
  try {
    const now = new Date();
    const horizon = addHours(now, 2);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'confirmed',
        reminded: false,
        archived: false
      },
      include: { shop: true }
    });

    let sentCount = 0;

    for (const appt of appointments) {
      try {
        // Converte data (YYYY-MM-DD) e hora (HH:MM) para um objeto Date real
        // parse(value, format, baseDate)
        const apptDate = parse(`${appt.date} ${appt.time}`, 'yyyy-MM-dd HH:mm', new Date());
        
        // Verifica se o agendamento está entre AGORA e as próximas 2 HORAS
        if (isAfter(apptDate, now) && apptDate <= horizon) {
          logger.info({ client: appt.clientName, time: appt.time }, '[SCHEDULER] Disparando lembrete WhatsApp');

          const message = `⏰ Lembrete BarberPro: Olá ${appt.clientName}! Passando pra lembrar do seu horário hoje às ${appt.time} na Barbearia ${appt.shop.name} para: ${appt.serviceNames}. Te esperamos lá!`;

          const success = await notificationService.sendWhatsAppMessage(
            appt.clientPhone,
            message,
            appt.shop
          );

          if (success) {
            await prisma.appointment.update({
              where: { id: appt.id },
              data: { reminded: true }
            });
            sentCount++;
          }
        }
      } catch (err) {
        logger.error({ apptId: appt.id, error: err.message }, '[SCHEDULER] Erro ao processar agendamento específico');
      }
    }
    
    return { 
      success: true, 
      sent: sentCount,
      message: `${sentCount} lembretes processados com sucesso.` 
    };
  } catch (error) {
    logger.error({ error: error.message }, '[SCHEDULER] Falha crítica no processamento de alertas');
    throw error;
  }
}

module.exports = { processReminders };
