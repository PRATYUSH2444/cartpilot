import { MongoMemoryServer } from 'mongodb-memory-server';
import { runSeed } from '../database/seed.js';
import { connectDatabase, disconnectDatabase } from '../database/connection.js';

let mongoServer: MongoMemoryServer;

export async function setupTestDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await disconnectDatabase();
  await connectDatabase(uri);
  // Run seed against the in-memory database so all tests have access to seeded products/users
  await runSeed(true);
}

export async function teardownTestDatabase(): Promise<void> {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
