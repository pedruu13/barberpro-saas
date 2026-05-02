const { requireActivePlan } = require('../src/middlewares/planMiddleware');

describe('planMiddleware - requireActivePlan', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      shop: {
        plan: 'trial',
        planStatus: 'active',
        trialEndsAt: new Date(Date.now() + 86400000), // Tomorrow
        planPaidUntil: null
      },
      path: '/api/admin/data'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next if trial is active', () => {
    requireActivePlan(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if shop is missing in req', () => {
    delete req.shop;
    requireActivePlan(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('should return 403 if planStatus is inactive', () => {
    req.shop.planStatus = 'inactive';
    requireActivePlan(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/inativa/) }));
  });

  it('should return 402 if trial has expired', () => {
    req.shop.trialEndsAt = new Date(Date.now() - 86400000); // Yesterday
    requireActivePlan(req, res, next);
    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/expirou/) }));
  });

  it('should call next if paid plan is active', () => {
    req.shop.plan = 'basic';
    req.shop.planPaidUntil = new Date(Date.now() + 86400000);
    requireActivePlan(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 402 if paid plan has expired', () => {
    req.shop.plan = 'basic';
    req.shop.planPaidUntil = new Date(Date.now() - 86400000);
    requireActivePlan(req, res, next);
    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringMatching(/assinatura expirou/) }));
  });
});
