const { createPixPaymentPreference } = require('../src/services/paymentService');
const { Preference } = require('mercadopago');

// Mock out the Mercado Pago SDK
jest.mock('mercadopago', () => {
  return {
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Preference: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn().mockResolvedValue({ init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123' })
      };
    })
  };
});

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MP_ACCESS_TOKEN = 'mock-env-token';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  it('should create a Mercado Pago preference successfully', async () => {
    const shop = { mpAccessToken: 'mock-shop-token' };
    const appointment = {
      id: 'appt123',
      serviceNames: 'Corte Tradicional',
      clientName: 'João'
    };
    const price = 35.0;

    const result = await createPixPaymentPreference(shop, appointment, price);

    expect(result).toHaveProperty('init_point');
    expect(result.init_point).toContain('sandbox.mercadopago.com.br');
    
    // Verify Preference constructor was called
    expect(Preference).toHaveBeenCalled();
  });

  it('should gracefully handle preference creation errors', async () => {
    // Override the mock to throw an error for this test
    Preference.mockImplementationOnce(() => {
      return {
        create: jest.fn().mockRejectedValue(new Error('MP API Error'))
      };
    });

    const shop = { mpAccessToken: 'mock-shop-token' };
    const appointment = { id: 'appt123', serviceNames: 'Corte', clientName: 'João' };
    
    const result = await createPixPaymentPreference(shop, appointment, 35.0);
    
    // As per the implementation, it catches errors and returns null
    expect(result).toBeNull();
  });
});
