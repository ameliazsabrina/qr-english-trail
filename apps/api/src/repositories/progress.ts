import type { PlayerProgress } from "@bonjotan/shared-types";
import type { Database } from "../db/client.js";

export function getProgress(database: Database, playerId: string): PlayerProgress {
  const rows = database.sqlite.prepare("SELECT point_id, awarded_score FROM point_completions WHERE player_id = ? ORDER BY completed_at, point_id")
    .all(playerId) as Array<{ point_id: string; awarded_score: number }>;
  return {
    totalScore: rows.reduce((sum, row) => sum + row.awarded_score, 0),
    completedPointCount: rows.length,
    completedPointIds: rows.map((row) => row.point_id),
  };
}
