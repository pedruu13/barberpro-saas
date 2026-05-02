const { register } = require('../src/controllers/authController');
const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');

jest.mock('../src/lib/prisma', () => ({
  shop: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('bcryptjs', () => ({
  hashSync: jest.fn().mockReturnValue('hashed_pass')
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token')
}));

describe('authController - register (Onboarding)', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: { name: 'Barbearia do Teste', email: 'teste@barber.com', password: 'password123' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should create a shop with default seed data', async () => {
    prisma.shop.findUnique.mockResolvedValue(null);
    prisma.shop.create.mockResolvedValue({ id: 'shop-1', name: 'Barbearia do Teste' });

    await register(req, res, next);

    expect(prisma.shop.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Barbearia do Teste',
        email: 'teste@barber.com',
        services: expect.any(Object), // seedData
        barbers: expect.any(Object),  // seedData
        hours: expect.any(Object)     // seedData
      })
    }));
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      token: 'mock_token',
      shopId: 'shop-1'
    }));
  });

  it('should return 400 if email already exists', async () => {
    prisma.shop.findUnique.mockResolvedValue({ id: 'existing' });

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email já cadastrado.' });
  });

  it('should throw Zod error for invalid email', async () => {
    req.body.email = 'invalid-email';
    
    await register(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].name).toBe('ZodError');
  });
});
