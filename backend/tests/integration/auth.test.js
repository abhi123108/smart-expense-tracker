const request = require('supertest');
const createApp = require('../../app');
const db = require('./dbHandler');

const app = createApp();

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('POST /api/auth/register', () => {
  test('registers a new user and returns a JWT token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.token).toBeDefined();
    expect(res.body.password).toBeUndefined(); // password hash should never be returned
  });

  test('rejects registration with a duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: 'dup@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: 'dup@example.com',
      password: 'password456',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('rejects registration with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'noname@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'correctpassword',
    });
  });

  test('logs in successfully with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'correctpassword',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  test('rejects login for a non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'doesnotexist@example.com',
      password: 'whatever',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/profile', () => {
  test('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('returns profile for an authenticated user', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Profile User',
      email: 'profile@example.com',
      password: 'password123',
    });
    const token = registerRes.body.token;

    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile@example.com');
  });
});
