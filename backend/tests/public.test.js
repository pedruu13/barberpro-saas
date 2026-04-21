const request = require('supertest');
const app = require('../src/app');

describe('Server Basics & Public Routes', () => {
  it('GET /health should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/public/shop/:id should return 404 for invalid shop uuid', async () => {
    // Assuming 'invalid-id' is not a valid uuid format or just not found
    const res = await request(app).get('/api/public/shop/invalid-id');
    // Prisma usually throws or returns null
    expect(res.statusCode).toBe(404);
  });
});
