import { MongoClient, type Db } from "mongodb";

let client: MongoClient | undefined;

export async function connectDatabase(uri: string): Promise<Db> {
  client = new MongoClient(uri);
  await client.connect();
  const database = client.db();

  await Promise.all([
    database.collection("players").createIndex({ publicPlayerId: 1 }, { unique: true }),
    database.collection("players").createIndex({ recoveryCodeHash: 1 }, { unique: true }),
    database.collection("players").createIndex({ eligibleTotalScore: -1, completedPointCount: -1, scoreReachedAt: 1 }),
    database.collection("pointCompletions").createIndex({ playerId: 1, pointId: 1 }, { unique: true }),
    database.collection("quizAttempts").createIndex({ playerId: 1, pointId: 1, issuedAt: -1 })
  ]);

  return database;
}

export async function disconnectDatabase(): Promise<void> {
  await client?.close();
  client = undefined;
}

