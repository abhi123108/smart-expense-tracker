const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

/**
 * Spins up an in-memory MongoDB instance and connects mongoose to it.
 * NOTE: the first time this runs on a machine, mongodb-memory-server downloads
 * a real mongod binary (~100MB) from the internet - this requires network access
 * and may take a minute. Subsequent runs use the cached binary and are fast.
 */
async function connect() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

module.exports = { connect, closeDatabase, clearDatabase };
