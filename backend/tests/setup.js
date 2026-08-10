// Runs before every test file. Keep this fast and DB-free -
// integration tests manage their own in-memory MongoDB in tests/integration/dbHandler.js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_ci';
process.env.NODE_ENV = 'test';
