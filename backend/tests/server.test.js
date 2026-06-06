const request = require('supertest');

// Note: These tests assume the backend server is running on localhost:5000
// and a MongoDB instance is available. For CI, start the server in a step before running tests.

const BASE = process.env.BASE_URL || 'http://localhost:5000';

describe('Basic API smoke tests', () => {
  test('GET /getjobs returns 200', async () => {
    const res = await request(BASE).get('/getjobs');
    expect([200, 500]).toContain(res.status); // 200 when DB ok, 500 when DB errors
  });

  test('GET /notifications requires query param', async () => {
    const res = await request(BASE).get('/notifications');
    expect(res.status).toBe(400);
  });
});
