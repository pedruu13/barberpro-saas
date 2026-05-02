const { updateClientCuts, createService } = require('../src/controllers/adminController');
const prisma = require('../src/lib/prisma');
const logger = require('../src/lib/logger');

// Mock Prisma
jest.mock('../src/lib/prisma', () => ({
  client: {
    updateMany: jest.fn(),
  },
  service: {
    create: jest.fn()
  }
}));

// Mock Logger
jest.mock('../src/lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('adminController - updateClientCuts', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'client-123' },
      body: { cutsUsed: 5 },
      user: { shopId: 'shop-456' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should update client cuts successfully', async () => {
    prisma.client.updateMany.mockResolvedValue({ count: 1 });

    await updateClientCuts(req, res);

    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: { id: 'client-123', shopId: 'shop-456' },
      data: { cutsUsed: 5 }
    });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('should clamp negative cuts to 0', async () => {
    req.body.cutsUsed = -5;
    prisma.client.updateMany.mockResolvedValue({ count: 1 });

    await updateClientCuts(req, res);

    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: { id: 'client-123', shopId: 'shop-456' },
      data: { cutsUsed: 0 }
    });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});

describe('adminController - createService', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { name: 'Corte', price: 50, duration: 30, desc: 'Top' },
      user: { shopId: 'shop-456' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should create a service successfully with valid data', async () => {
    const mockSvc = { id: 'svc-1', ...req.body, shopId: 'shop-456' };
    prisma.service.create.mockResolvedValue(mockSvc);

    await createService(req, res);

    expect(prisma.service.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockSvc);
  });

  it('should throw Zod error if price is negative', async () => {
    req.body.price = -10;
    
    // asyncHandler will catch the error and pass to next. 
    // Since we are calling the controller directly in the test, 
    // it will throw the Zod error because we didn't wrap it with a next mock here.
    // However, if we want to test the asyncHandler behavior, we should pass next.
    const next = jest.fn();
    await createService(req, res, next);
    
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].name).toBe('ZodError');
  });
});
