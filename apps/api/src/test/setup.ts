import { MongoMemoryServer } from 'mongodb-memory-server';
import { runSeed } from '../database/seed.js';
import { connectDatabase, disconnectDatabase } from '../database/connection.js';

let mongoServer: MongoMemoryServer | null = null;

export async function setupTestDatabase(): Promise<void> {
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    try {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    } catch {
      uri = 'mongodb://127.0.0.1:27017/cartpilot_test';
    }
  }

  await disconnectDatabase();
  await connectDatabase(uri);
  // Run seed against the test database so all tests have access to seeded products/users
  await runSeed(true);
}

export async function teardownTestDatabase(): Promise<void> {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}
