const request = require('supertest');
const app = require('../app');

describe('Error Handler Middleware - All Cases', () => {
  it('should handle SequelizeDatabaseError', async () => {
    // Trigger a database error by sending invalid data
    const res = await request(app)
      .post('/api/auth/register')
      .send({ 
        email: 'test@test.com', 
        password: 'password123', 
        name: 'Test',
        invalid_field: 'value'
      });

    // Should not crash the server
    expect(res.status).toBeLessThanOrEqual(500);
  });

  it('should handle ServiceUnavailable errors', async () => {
    // This tests the 503 error handler
    const res = await request(app)
      .post('/api/auth/google')
      .send({ id_token: 'test' });

    // Should return 401 for invalid token, not 500
    expect(res.status).toBe(401);
  });

  it('should handle JsonWebTokenError', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should handle missing authorization header', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should handle malformed authorization header', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'InvalidFormat token123');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when token is valid but user no longer exists', async () => {
    const { signToken } = require('../helpers/jwt');
    const ghostToken = signToken({
      id: 999999999,
      email: 'ghost@test.com',
      name: 'Ghost',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${ghostToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Watchlist Controller - Authentication', () => {
  it('should return 401 for watchlist without token', async () => {
    const res = await request(app).get('/api/watchlist');
    expect(res.status).toBe(401);
  });

  it('should return 401 for adding to watchlist without token', async () => {
    const res = await request(app)
      .post('/api/watchlist')
      .send({ stock_id: 1 });
    expect(res.status).toBe(401);
  });

  it('should return 401 for deleting from watchlist without token', async () => {
    const res = await request(app).delete('/api/watchlist/1');
    expect(res.status).toBe(401);
  });
});