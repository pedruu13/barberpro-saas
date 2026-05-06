const { createPixPaymentPreference, createDirectPixPayment } = require('../src/services/paymentService');
const { Preference, Payment } = require('mercadopago');

// Mock out the Mercado Pago SDK
jest.mock('mercadopago', () => {
  return {
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Preference: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn().mockResolvedValue({ init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123' })
      };
    }),
    Payment: jest.fn().mockImplementation(() => {
      return {
        create: jest.fn().mockResolvedValue({
          id: 'pay123',
          point_of_interaction: {
            transaction_data: {
              qr_code: '00020126360014br.gov.bcb.pix0114+551199999999',
              qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgA...'
            }
          }
        })
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

  describe('createPixPaymentPreference', () => {
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

  describe('createDirectPixPayment', () => {
    it('should create a direct PIX payment and return QR Code data', async () => {
      const shop = { mpAccessToken: 'mock-shop-token' };
      const appointment = { id: 'appt123', serviceNames: 'Corte' };
      const price = 35.0;
      const payerEmail = 'joao@example.com';

      const result = await createDirectPixPayment(shop, appointment, price, payerEmail);

      expect(result).toHaveProperty('id', 'pay123');
      expect(result).toHaveProperty('qr_code');
      expect(result).toHaveProperty('qr_code_base64');
      expect(result.qr_code).toBe('00020126360014br.gov.bcb.pix0114+551199999999');
      
      expect(Payment).toHaveBeenCalled();
    });

    it('should handle direct PIX payment errors', async () => {
      Payment.mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValue(new Error('Payment API Error'))
        };
      });

      const shop = { mpAccessToken: 'mock-shop-token' };
      const result = await createDirectPixPayment(shop, { id: '123' }, 35.0, 'test@test.com');
      
      expect(result).toBeNull();
    });
  });
});
