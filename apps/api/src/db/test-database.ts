import { openDatabase } from "./client.js";

export function createTestDatabase() {
  return openDatabase(":memory:");
}
