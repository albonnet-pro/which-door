"use server";

import { z } from "zod";
import { getDb } from "@/db";
import { votes } from "@/db/schema";
import { getDoor, getVoteCounts } from "@/lib/queries";

const voteSchema = z.object({
  roundId: z.number().int().positive(),
  doorId: z.number().int().positive(),
});

export type VoteResult = { counts: Record<number, number> } | { error: string };

export async function vote(input: { roundId: number; doorId: number }): Promise<VoteResult> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) return { error: "Vote invalide" };

  const { roundId, doorId } = parsed.data;
  const door = await getDoor(doorId);
  if (!door || door.roundId !== roundId) return { error: "Cette porte n'existe pas" };

  await getDb().insert(votes).values({ roundId, doorId });
  return { counts: await getVoteCounts(roundId) };
}
