const prisma = require('../lib/prisma');
const notificationService = require('../services/notificationService');

/**
 * Processa os lembretes de pré-agendamento (Anti No-Show).
 * O horizonte padrão é 2 horas à frente do horário atual.
 */
async function processReminders() {
  console.log('[SCHEDULER] Processando alertas pré-agendamento via Rota Serverless...');
  try {
    const now = new Date();
    // O horizonte de lembretes é de 2 horas à frente (2 * 60 * 60 * 1000 = 7200000 ms)
    const horizon = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'confirmed',
        reminded: false,
        archived: false
      },
      include: { shop: true }
    });

    for (const appt of appointments) {
      // Formata appt.date e appt.time para Date real
      // assumindo que date seja "YYYY-MM-DD" e time "HH:MM"
      const apptDateStr = `${appt.date}T${appt.time}:00`;
      const apptDate = new Date(apptDateStr);
      
      // Verifica se a data do agendamento cai na janela das proximas 2 horas
      // E checa se ele está no futuro (para não alertar coisa do passado)
      if (apptDate > now && apptDate <= horizon) {
        console.log(`[SCHEDULER] Enviando lembrete para: ${appt.clientName} (${appt.clientPhone}).`);

        // Dispara Zap
        await notificationService.sendWhatsAppMessage(
          appt.clientPhone,
          `⏰ Lembrete BarberPro: Olá ${appt.clientName}! Passando pra lembrar do seu horário hoje às ${appt.time} na Barbearia ${appt.shop.name} para: ${appt.serviceNames}. Te esperamos lá!`,
          appt.shop
        ).catch(e => console.error('[SCHEDULER] Erro WhatsApp:', e));

        // Atualiza para não mandar de novo
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminded: true }
        });
      }
    }
    
    return { success: true, message: "Lembretes processados com sucesso." };
  } catch (error) {
    console.error('[SCHEDULER] Erro no processamento de alertas', error);
    throw error;
  }
}

module.exports = { processReminders };
