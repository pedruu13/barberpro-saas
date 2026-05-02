const { handleWebhook } = require('../src/controllers/billingController');
const prisma = require('../src/lib/prisma');
const { Payment } = require('mercadopago');

jest.mock('../src/lib/prisma', () => ({
  shop: {
    findUnique: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn(),
  Preference: jest.fn(),
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn()
  }))
}));

describe('billingController - handleWebhook', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { type: 'payment', data: { id: '12345' } }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should update shop plan when payment is approved', async () => {
    const mockPayment = {
      status: 'approved',
      external_reference: 'shop-abc'
    };
    
    // Configura o mock do Payment.get
    const paymentInstance = new Payment();
    paymentInstance.get.mockResolvedValue(mockPayment);
    Payment.mockImplementation(() => paymentInstance);

    prisma.shop.findUnique.mockResolvedValue({ id: 'shop-abc', planPaidUntil: null });

    await handleWebhook(req, res);

    expect(prisma.shop.update).toHaveBeenCalledWith({
      where: { id: 'shop-abc' },
      data: expect.objectContaining({
        planStatus: 'active',
        plan: 'basic'
      })
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should ignore non-payment types', async () => {
    req.body.type = 'other';
    await handleWebhook(req, res);
    expect(prisma.shop.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
