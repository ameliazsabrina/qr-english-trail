import type { LeaderboardEntry, LeaderboardResponse } from "@bonjotan/shared-types";
import type { Database } from "../db/client.js";

type RankedRow = { player_id: string; nickname: string; avatar_id: string; total_score: number; completed_point_count: number; rank: number };

export function getLeaderboard(database: Database, limit: number, currentPlayerId?: string): LeaderboardResponse {
  const rows = database.sqlite.prepare(`WITH totals AS (
    SELECT p.id AS player_id, p.nickname, p.avatar_id,
      SUM(pc.awarded_score) AS total_score, COUNT(pc.id) AS completed_point_count,
      MAX(pc.completed_at) AS score_reached_at
    FROM players p JOIN point_completions pc ON pc.player_id = p.id
    WHERE p.status = 'active' GROUP BY p.id
  ), ranked AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY total_score DESC, completed_point_count DESC, score_reached_at ASC, player_id ASC) AS rank
    FROM totals
  ) SELECT player_id, nickname, avatar_id, total_score, completed_point_count, rank FROM ranked ORDER BY rank`).all() as RankedRow[];
  const map = (row: RankedRow): LeaderboardEntry => ({
    rank: row.rank,
    nickname: row.nickname,
    avatarId: row.avatar_id,
    totalScore: row.total_score,
    completedPointCount: row.completed_point_count,
    isCurrentPlayer: row.player_id === currentPlayerId,
  });
  const entries = rows.slice(0, limit).map(map);
  const current = currentPlayerId ? rows.find((row) => row.player_id === currentPlayerId) : undefined;
  return { entries, ...(current && current.rank > limit ? { currentPlayer: map(current) } : {}) };
}
