import { createHmac } from "node:crypto";
import { learningPoints } from "@bonjotan/content";
import type { Question } from "@bonjotan/shared-types";
import { ObjectId, type Db } from "mongodb";
import { connectDatabase, disconnectDatabase } from "../repositories/mongo.js";

const SEED_NAME = "development-demo";
const SEED_VERSION = 1;
const SEED_HASH_KEY = "bonjotan-development-seed-only";

type SeedPlayer = {
  _id: ObjectId;
  publicPlayerId: string;
  nickname: string;
  normalizedNickname: string;
  avatarId: string;
  recoveryCodeHash: string;
  eligibleTotalScore: number;
  completedPointCount: number;
  status: "active";
  createdAt: Date;
  updatedAt: Date;
  scoreReachedAt: Date;
  _seed: SeedMetadata;
};

type SeedCompletion = {
  _id: ObjectId;
  playerId: ObjectId;
  pointId: string;
  eligibleAttemptId: ObjectId;
  awardedScore: number;
  questionIds: string[];
  contentVersion: string;
  completedAt: Date;
  _seed: SeedMetadata;
};

type SeedAttempt = {
  _id: ObjectId;
  playerId: ObjectId;
  pointId: string;
  mode: "eligible" | "practice";
  status: "submitted";
  questionIds: string[];
  responses: Array<{
    questionId: string;
    submittedAnswer: string;
    correct: boolean;
    awardedScore: number;
  }>;
  awardedScore: number;
  contentVersion: string;
  issuedAt: Date;
  submittedAt: Date;
  idempotencyKey: string;
  _seed: SeedMetadata;
};

type SeedMetadata = {
  name: typeof SEED_NAME;
  version: typeof SEED_VERSION;
};

type CompletionFixture = {
  pointId: string;
  score: number;
  completedAt: string;
  attemptId: string;
  completionId: string;
  correctAnswers: number;
};

type PlayerFixture = {
  id: string;
  publicPlayerId: string;
  nickname: string;
  avatarId: string;
  recoveryCode: string;
  createdAt: string;
  completions: CompletionFixture[];
};

const seedMetadata: SeedMetadata = { name: SEED_NAME, version: SEED_VERSION };

const fixtures: PlayerFixture[] = [
  {
    id: "64b000000000000000000001",
    publicPlayerId: "seed-player-ayu",
    nickname: "Ayu Explorer",
    avatarId: "butterfly",
    recoveryCode: "BJN-AYU7-DEMO",
    createdAt: "2026-08-01T01:00:00.000Z",
    completions: [
      { pointId: "point-01", score: 220, completedAt: "2026-08-01T01:10:00.000Z", attemptId: "64b000000000000000000101", completionId: "64b000000000000000000201", correctAnswers: 2 },
      { pointId: "point-02", score: 120, completedAt: "2026-08-02T01:10:00.000Z", attemptId: "64b000000000000000000102", completionId: "64b000000000000000000202", correctAnswers: 1 },
      { pointId: "point-03", score: 220, completedAt: "2026-08-03T01:10:00.000Z", attemptId: "64b000000000000000000103", completionId: "64b000000000000000000203", correctAnswers: 2 }
    ]
  },
  {
    id: "64b000000000000000000002",
    publicPlayerId: "seed-player-bima",
    nickname: "Bima Brave",
    avatarId: "gecko",
    recoveryCode: "BJN-BIM4-DEMO",
    createdAt: "2026-08-04T02:00:00.000Z",
    completions: [
      { pointId: "point-01", score: 120, completedAt: "2026-08-04T02:10:00.000Z", attemptId: "64b000000000000000000104", completionId: "64b000000000000000000204", correctAnswers: 1 },
      { pointId: "point-02", score: 220, completedAt: "2026-08-05T02:10:00.000Z", attemptId: "64b000000000000000000105", completionId: "64b000000000000000000205", correctAnswers: 2 }
    ]
  },
  {
    id: "64b000000000000000000003",
    publicPlayerId: "seed-player-cici",
    nickname: "Cici Ceria",
    avatarId: "sunbird",
    recoveryCode: "BJN-CIC1-DEMO",
    createdAt: "2026-08-06T03:00:00.000Z",
    completions: [
      { pointId: "point-01", score: 20, completedAt: "2026-08-06T03:10:00.000Z", attemptId: "64b000000000000000000106", completionId: "64b000000000000000000206", correctAnswers: 0 }
    ]
  }
];

function recoveryCodeHash(code: string): string {
  const normalizedCode = code.replaceAll("-", "").toUpperCase();
  return createHmac("sha256", SEED_HASH_KEY).update(normalizedCode).digest("hex");
}

function getPoint(pointId: string) {
  const point = learningPoints.find((candidate) => candidate.id === pointId);
  if (!point) throw new Error(`Seed references unknown learning point: ${pointId}`);
  return point;
}

function submittedResponse(question: Question, correct: boolean, mode: "eligible" | "practice") {
  if (!question.correctOptionId || !question.options) {
    throw new Error(`Seed requires a multiple-choice answer for question: ${question.id}`);
  }

  const submittedAnswer = correct
    ? question.correctOptionId
    : question.options.find((option) => option.id !== question.correctOptionId)?.id;

  if (!submittedAnswer) throw new Error(`Question has no incorrect seed answer: ${question.id}`);

  return {
    questionId: question.id,
    submittedAnswer,
    correct,
    awardedScore: mode === "eligible" && correct ? 100 : 0
  };
}

function buildSeedDocuments() {
  const players: SeedPlayer[] = [];
  const completions: SeedCompletion[] = [];
  const attempts: SeedAttempt[] = [];

  for (const fixture of fixtures) {
    const playerId = new ObjectId(fixture.id);
    const scoreReachedAt = new Date(fixture.completions.at(-1)?.completedAt ?? fixture.createdAt);
    const eligibleTotalScore = fixture.completions.reduce((total, completion) => total + completion.score, 0);

    players.push({
      _id: playerId,
      publicPlayerId: fixture.publicPlayerId,
      nickname: fixture.nickname,
      normalizedNickname: fixture.nickname.toLocaleLowerCase("en"),
      avatarId: fixture.avatarId,
      recoveryCodeHash: recoveryCodeHash(fixture.recoveryCode),
      eligibleTotalScore,
      completedPointCount: fixture.completions.length,
      status: "active",
      createdAt: new Date(fixture.createdAt),
      updatedAt: scoreReachedAt,
      scoreReachedAt,
      _seed: seedMetadata
    });

    for (const fixtureCompletion of fixture.completions) {
      const point = getPoint(fixtureCompletion.pointId);
      const questions = point.questions.filter((question) => question.active).slice(0, 2);
      if (questions.length !== 2) throw new Error(`Point needs two active seed questions: ${point.id}`);

      const questionIds = questions.map((question) => question.id);
      const responses = questions.map((question, index) =>
        submittedResponse(question, index < fixtureCompletion.correctAnswers, "eligible")
      );
      const attemptId = new ObjectId(fixtureCompletion.attemptId);
      const completedAt = new Date(fixtureCompletion.completedAt);

      attempts.push({
        _id: attemptId,
        playerId,
        pointId: point.id,
        mode: "eligible",
        status: "submitted",
        questionIds,
        responses,
        awardedScore: fixtureCompletion.score,
        contentVersion: point.contentVersion,
        issuedAt: new Date(completedAt.getTime() - 2 * 60 * 1000),
        submittedAt: completedAt,
        idempotencyKey: `seed-${attemptId.toHexString()}`,
        _seed: seedMetadata
      });

      completions.push({
        _id: new ObjectId(fixtureCompletion.completionId),
        playerId,
        pointId: point.id,
        eligibleAttemptId: attemptId,
        awardedScore: fixtureCompletion.score,
        questionIds,
        contentVersion: point.contentVersion,
        completedAt,
        _seed: seedMetadata
      });
    }
  }

  return { players, completions, attempts };
}

async function replaceSeedDocuments<T extends { _id: ObjectId }>(
  db: Db,
  collectionName: string,
  documents: T[]
): Promise<void> {
  const collection = db.collection(collectionName);
  await collection.bulkWrite(documents.map((document) => ({
    replaceOne: {
      filter: { _id: document._id },
      replacement: document,
      upsert: true
    }
  })));
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("MongoDB seed is disabled when NODE_ENV=production");
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required. Export it before running pnpm seed:mongo");

  const db = await connectDatabase(uri);
  const documents = buildSeedDocuments();

  await replaceSeedDocuments(db, "players", documents.players);
  await replaceSeedDocuments(db, "quizAttempts", documents.attempts);
  await replaceSeedDocuments(db, "pointCompletions", documents.completions);

  console.info(
    `Seeded ${documents.players.length} players, ${documents.attempts.length} quiz attempts, and ${documents.completions.length} point completions into ${db.databaseName}.`
  );
  console.info("Demo recovery codes: BJN-AYU7-DEMO, BJN-BIM4-DEMO, BJN-CIC1-DEMO");
}

try {
  await main();
} finally {
  await disconnectDatabase();
}
