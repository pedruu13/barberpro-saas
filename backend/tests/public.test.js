const request = require('supertest');
const app = require('../src/app');

// Mock Prisma
jest.mock('../src/lib/prisma', () => ({
  shop: {
    findFirst: jest.fn()
  }
}));

const prisma = require('../src/lib/prisma');

describe('Server Basics & Public Routes', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/public/shop/:id should return 404 for invalid shop uuid', async () => {
    prisma.shop.findFirst.mockResolvedValue(null);
    const res = await request(app).get('/api/public/shop/invalid-id');
    expect(res.statusCode).toBe(404);
  });
});
