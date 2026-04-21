const { MercadoPagoConfig, Preference } = require('mercadopago');

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

module.exports = {
  createPixPaymentPreference
};
