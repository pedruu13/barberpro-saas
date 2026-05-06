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
 * Processa variáveis em um template de mensagem.
 */
function formatTemplate(template, data) {
  if (!template) return '';
  let msg = template;
  msg = msg.replace(/{{cliente}}/g, data.clientName || '');
  msg = msg.replace(/{{servico}}/g, data.serviceNames || '');
  msg = msg.replace(/{{data}}/g, data.date || '');
  msg = msg.replace(/{{hora}}/g, data.time || '');
  msg = msg.replace(/{{barbeiro}}/g, data.barberName || '');
  msg = msg.replace(/{{preco}}/g, data.price || '');
  msg = msg.replace(/{{barbearia}}/g, data.shopName || '');
  return msg;
}

/**
 * Envia mensagem via WhatsApp Cloud API (Oficial Meta).
 */
async function sendWhatsAppMeta(phone, data, shop) {
  const token = shop.waCloudToken;
  const phoneId = shop.waPhoneId;
  const templateName = shop.waTemplateName || 'confirmacao_agendamento';

  if (!token || !phoneId) return false;

  let normalized = String(phone || '').replace(/\D/g, '');
  if (normalized.length === 10 || normalized.length === 11) normalized = '55' + normalized;

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized,
        type: "template",
        template: {
          name: templateName,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: data.clientName },
                { type: "text", text: data.serviceNames },
                { type: "text", text: data.date },
                { type: "text", text: data.time }
              ]
            }
          ]
        }
      })
    });

    const result = await response.json();
    if (response.ok) {
      logger.info({ normalized }, '[WhatsApp Meta] ✅ Mensagem enviada');
      return true;
    } else {
      logger.error({ error: result }, '[WhatsApp Meta] ❌ Erro na API');
      return false;
    }
  } catch (error) {
    logger.error({ error: error.message }, '[WhatsApp Meta] ❌ Falha na requisição');
    return false;
  }
}

module.exports = { sendWhatsAppMessage, sendEmailNotification, formatTemplate, sendWhatsAppMeta };
