const request = require('supertest');
const createApp = require('../../app');
const db = require('./dbHandler');

const app = createApp();
let token;

beforeAll(async () => await db.connect());
afterAll(async () => await db.closeDatabase());

beforeEach(async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Expense Tester',
    email: 'expenses@example.com',
    password: 'password123',
  });
  token = res.body.token;
});

afterEach(async () => await db.clearDatabase());

const authed = (req) => req.set('Authorization', `Bearer ${token}`);

describe('POST /api/expenses', () => {
  test('creates a new expense for the authenticated user', async () => {
    const res = await authed(request(app).post('/api/expenses')).send({
      title: 'Lunch',
      amount: 250,
      category: 'Food',
      paymentMethod: 'UPI',
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Lunch');
    expect(res.body.amount).toBe(250);
    expect(res.body.source).toBe('manual');
  });

  test('rejects expense creation without required fields', async () => {
    const res = await authed(request(app).post('/api/expenses')).send({ title: 'Missing amount' });
    expect(res.status).toBe(400);
  });

  test('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/expenses').send({ title: 'X', amount: 10, category: 'Food' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/expenses', () => {
  test('returns only the logged-in user\'s expenses, not other users\'', async () => {
    // Create expense for user A (the default token)
    await authed(request(app).post('/api/expenses')).send({ title: 'User A Expense', amount: 100, category: 'Food' });

    // Register a second user and create an expense for them
    const userB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
    });
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${userB.body.token}`)
      .send({ title: 'User B Expense', amount: 200, category: 'Shopping' });

    const res = await authed(request(app).get('/api/expenses'));
    expect(res.status).toBe(200);
    expect(res.body.expenses).toHaveLength(1);
    expect(res.body.expenses[0].title).toBe('User A Expense');
  });

  test('filters expenses by category', async () => {
    await authed(request(app).post('/api/expenses')).send({ title: 'Groceries run', amount: 500, category: 'Groceries' });
    await authed(request(app).post('/api/expenses')).send({ title: 'Movie night', amount: 300, category: 'Entertainment' });

    const res = await authed(request(app).get('/api/expenses?category=Groceries'));
    expect(res.status).toBe(200);
    expect(res.body.expenses).toHaveLength(1);
    expect(res.body.expenses[0].category).toBe('Groceries');
  });
});

describe('PUT /api/expenses/:id', () => {
  test('updates an existing expense', async () => {
    const created = await authed(request(app).post('/api/expenses')).send({ title: 'Old Title', amount: 100, category: 'Food' });
    const res = await authed(request(app).put(`/api/expenses/${created.body._id}`)).send({ title: 'New Title', amount: 150 });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
    expect(res.body.amount).toBe(150);
  });

  test('returns 404 when updating a non-existent expense', async () => {
    const fakeId = '64b6f7f7f7f7f7f7f7f7f7f7';
    const res = await authed(request(app).put(`/api/expenses/${fakeId}`)).send({ title: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/expenses/:id', () => {
  test('deletes an expense belonging to the user', async () => {
    const created = await authed(request(app).post('/api/expenses')).send({ title: 'To Delete', amount: 50, category: 'Other' });
    const res = await authed(request(app).delete(`/api/expenses/${created.body._id}`));
    expect(res.status).toBe(200);

    const listRes = await authed(request(app).get('/api/expenses'));
    expect(listRes.body.expenses).toHaveLength(0);
  });
});

describe('GET /api/expenses/summary', () => {
  test('returns today/week/month totals and category breakdown', async () => {
    await authed(request(app).post('/api/expenses')).send({ title: 'Coffee', amount: 150, category: 'Food' });
    await authed(request(app).post('/api/expenses')).send({ title: 'Bus ticket', amount: 50, category: 'Transport' });

    const res = await authed(request(app).get('/api/expenses/summary'));
    expect(res.status).toBe(200);
    expect(res.body.monthTotal).toBe(200);
    expect(res.body.categoryBreakdown.length).toBe(2);
  });
});
