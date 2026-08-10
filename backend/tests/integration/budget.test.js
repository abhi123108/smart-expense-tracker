const request = require('supertest');
const createApp = require('../../app');
const db = require('./dbHandler');

const app = createApp();
let token;

beforeAll(async () => await db.connect());
afterAll(async () => await db.closeDatabase());

beforeEach(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Budget Tester',
    email: 'budget@example.com',
    password: 'password123',
  });
  token = res.body.token;
});

afterEach(async () => await db.clearDatabase());

const authed = (req) => req.set('Authorization', `Bearer ${token}`);

describe('POST /api/budgets', () => {
  test('creates a new budget', async () => {
    const res = await authed(request(app).post('/api/budgets')).send({
      category: 'Food',
      monthlyLimit: 5000,
      alertThresholdPercent: 80,
    });
    expect(res.status).toBe(201);
    expect(res.body.monthlyLimit).toBe(5000);
  });

  test('upserts (updates) an existing budget for the same category instead of duplicating', async () => {
    await authed(request(app).post('/api/budgets')).send({ category: 'Food', monthlyLimit: 5000 });
    await authed(request(app).post('/api/budgets')).send({ category: 'Food', monthlyLimit: 7000 });

    const list = await authed(request(app).get('/api/budgets'));
    expect(list.body).toHaveLength(1);
    expect(list.body[0].monthlyLimit).toBe(7000);
  });
});

describe('GET /api/budgets/alerts', () => {
  test('returns no alerts when spending is well under budget', async () => {
    await authed(request(app).post('/api/budgets')).send({ category: 'Food', monthlyLimit: 10000 });
    await authed(request(app).post('/api/expenses')).send({ title: 'Snack', amount: 100, category: 'Food' });

    const res = await authed(request(app).get('/api/budgets/alerts'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('returns a warning alert when spending crosses the alert threshold', async () => {
    await authed(request(app).post('/api/budgets')).send({ category: 'Food', monthlyLimit: 1000, alertThresholdPercent: 80 });
    await authed(request(app).post('/api/expenses')).send({ title: 'Big meal', amount: 850, category: 'Food' });

    const res = await authed(request(app).get('/api/budgets/alerts'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].level).toBe('warning');
  });

  test('returns an "exceeded" alert when spending goes over the budget limit', async () => {
    await authed(request(app).post('/api/budgets')).send({ category: 'Food', monthlyLimit: 500 });
    await authed(request(app).post('/api/expenses')).send({ title: 'Overspend', amount: 600, category: 'Food' });

    const res = await authed(request(app).get('/api/budgets/alerts'));
    expect(res.body[0].level).toBe('exceeded');
    expect(res.body[0].percentUsed).toBe(120);
  });
});

describe('DELETE /api/budgets/:id', () => {
  test('deletes a budget', async () => {
    const created = await authed(request(app).post('/api/budgets')).send({ category: 'Shopping', monthlyLimit: 2000 });
    const res = await authed(request(app).delete(`/api/budgets/${created.body._id}`));
    expect(res.status).toBe(200);

    const list = await authed(request(app).get('/api/budgets'));
    expect(list.body).toHaveLength(0);
  });
});
