const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// For initializing a client using MP access token
function getClient(accessToken) {
  // Use user's token or fallback to a sandbox env var
  const token = accessToken || process.env.MP_ACCESS_TOKEN;
  return new MercadoPagoConfig({ accessToken: token });
}

async function createPixPaymentPreference(shop, appointment, price) {
  try {
    const client = getClient(shop.mpAccessToken);
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: appointment.id,
            title: `Serviço Barbearia: ${appointment.serviceNames}`,
            quantity: 1,
            unit_price: price
          }
        ],
        payer: {
          name: appointment.clientName
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}?status=success`,
          failure: `${process.env.FRONTEND_URL}?status=failure`,
          pending: `${process.env.FRONTEND_URL}?status=pending`
        },
        auto_return: 'approved'
      }
    });

    return { init_point: result.init_point };
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    return null;
  }
}

async function createDirectPixPayment(shop, appointment, price, payerEmail) {
  try {
    const client = getClient(shop.mpAccessToken);
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: price,
        description: `Agendamento Barbearia - ${appointment.id}`,
        payment_method_id: 'pix',
        payer: {
          email: payerEmail
        }
      }
    });

    return {
      id: result.id,
      qr_code: result.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
      status: result.status,
      status_detail: result.status_detail
    };
  } catch (error) {
    console.error('Error creating direct PIX payment:', error);
    return null;
  }
}

module.exports = {
  createPixPaymentPreference,
  createDirectPixPayment
};
