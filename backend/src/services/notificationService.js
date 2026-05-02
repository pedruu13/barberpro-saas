/**
 * notificationService.js
 * Integração robusta com Z-API para WhatsApp e placeholders para e-mail.
 */
const logger = require('../lib/logger');

/**
 * Envia mensagem de texto via Z-API usando a Fetch API nativa.
 * @param {string} phone     - Número no formato internacional (ex: "5511999990000")
 * @param {string} message   - Texto a enviar
 * @param {object} [shop]    - Objeto shop com zapiInstance e zapiToken (opcional)
 * @returns {Promise<boolean>}
 */
async function sendWhatsAppMessage(phone, message, shop = null) {
  let normalized = String(phone || '').replace(/\D/g, '');
  
  // Adiciona o 55 (Brasil) caso o número tenha apenas 10 ou 11 dígitos
  if (normalized.length === 10 || normalized.length === 11) {
    normalized = '55' + normalized;
  }

  if (!normalized || normalized.length < 10) {
    logger.warn({ phone }, '[WhatsApp] Número inválido ou ausente. Notificação ignorada.');
    return false;
  }

  const instance = shop?.zapiInstance || process.env.ZAPI_INSTANCE;
  const token = shop?.zapiToken || process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instance || !token) {
    logger.debug({ normalized, message }, '[WhatsApp] Z-API não configurado para esta barbearia. Logando mensagem no console.');
    return false;
  }

  const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(clientToken ? { 'Client-Token': clientToken } : {})
      },
      body: JSON.stringify({ phone: normalized, message })
    });

    const data = await response.json();

    if (response.ok) {
      logger.info({ normalized }, '[WhatsApp] ✅ Mensagem enviada com sucesso');
      return true;
    } else {
      logger.error({ status: response.status, data }, '[WhatsApp] ❌ Erro na API Z-API');
      return false;
    }
  } catch (error) {
    logger.error({ error: error.message }, '[WhatsApp] ❌ Falha na requisição Z-API');
    return false;
  }
}

/**
 * Envia notificação por e-mail (Placeholder).
 */
async function sendEmailNotification(email, subject, text) {
  logger.info({ email, subject }, '[Email] Stub disparado (implementação futura)');
  return true;
}

module.exports = { sendWhatsAppMessage, sendEmailNotification };
