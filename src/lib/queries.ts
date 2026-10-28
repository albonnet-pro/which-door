import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { doors as doorsTable, rounds, votes, type Door, type Round } from "@/db/schema";

export type RoundWithDoors = Round & { left: Door; right: Door };

function withSides({ doors, ...round }: Round & { doors: Door[] }): RoundWithDoors | null {
  const left = doors.find((door) => door.side === "left");
  const right = doors.find((door) => door.side === "right");
  if (!left || !right) return null;
  return { ...round, left, right };
}

export async function getRounds({ activeOnly = false } = {}) {
  const rows = await getDb().query.rounds.findMany({
    where: activeOnly ? eq(rounds.active, true) : undefined,
    orderBy: [asc(rounds.position), asc(rounds.id)],
    with: { doors: true },
  });
  return rows.map(withSides).filter((round) => round !== null);
}

export async function getRound(id: number) {
  const round = await getDb().query.rounds.findFirst({
    where: eq(rounds.id, id),
    with: { doors: true },
  });
  return round ? withSides(round) : null;
}

/** Nombre de votes par porte (doorId → total). */
export async function getVoteCounts(roundId?: number) {
  const rows = await getDb()
    .select({ doorId: votes.doorId, total: count() })
    .from(votes)
    .where(roundId ? eq(votes.roundId, roundId) : undefined)
    .groupBy(votes.doorId);
  return Object.fromEntries(rows.map((row) => [row.doorId, row.total])) as Record<number, number>;
}

export async function getDoor(id: number) {
  return getDb().query.doors.findFirst({ where: eq(doorsTable.id, id) });
}
