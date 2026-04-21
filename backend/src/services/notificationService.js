/**
 * notificationService.js
 * Integração com Z-API para WhatsApp.
 * Documentação: https://developer.z-api.io/
 *
 * Configuração por barbearia (multi-tenant):
 *   shop.zapiInstance  → ID da instância Z-API (ex: "3D...")
 *   shop.zapiToken     → Token da instância Z-API
 *
 * Variável de ambiente global (fallback único para todas as lojas):
 *   ZAPI_INSTANCE, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN
 */

const https = require('https');

/**
 * Envia mensagem de texto via Z-API.
 * @param {string} phone     - Número no formato internacional sem + (ex: "5511999990000")
 * @param {string} message   - Texto a enviar
 * @param {object} [shop]    - Objeto shop com zapiInstance e zapiToken (opcional)
 * @returns {Promise<boolean>}
 */
async function sendWhatsAppMessage(phone, message, shop = null) {
  // Normaliza o número: remove tudo que não for dígito
  const normalized = String(phone || '').replace(/\D/g, '');
  if (!normalized || normalized.length < 10) {
    console.log(`[WhatsApp] Número inválido ou ausente: "${phone}" — notificação ignorada.`);
    return false;
  }

  // Prioridade: credenciais da barbearia → variáveis de ambiente globais
  const instance    = shop?.zapiInstance    || process.env.ZAPI_INSTANCE;
  const token       = shop?.zapiToken       || process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instance || !token) {
    console.log(`[WhatsApp] Z-API não configurado para esta barbearia. Mensagem que seria enviada para ${normalized}:\n${message}`);
    return false;
  }

  return new Promise((resolve) => {
    const body = JSON.stringify({ phone: normalized, message });
    const options = {
      hostname: 'api.z-api.io',
      path: `/instances/${instance}/token/${token}/send-text`,
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(clientToken ? { 'Client-Token': clientToken } : {})
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[WhatsApp] ✅ Mensagem enviada para ${normalized}`);
          resolve(true);
        } else {
          console.error(`[WhatsApp] ❌ Erro Z-API ${res.statusCode}: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`[WhatsApp] ❌ Falha na requisição Z-API:`, e.message);
      resolve(false);
    });

    req.setTimeout(8000, () => {
      console.error('[WhatsApp] ❌ Timeout na requisição Z-API (8s)');
      req.destroy();
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

/**
 * Envia notificação por e-mail.
 * Placeholder para integração futura com Nodemailer / Resend / SendGrid.
 */
async function sendEmailNotification(email, subject, text) {
  // TODO: integrar provedor de e-mail (ex: Resend, Nodemailer + SMTP)
  console.log(`[Email] Stub — para: ${email} | assunto: ${subject}\n${text}`);
  return true;
}

module.exports = { sendWhatsAppMessage, sendEmailNotification };
