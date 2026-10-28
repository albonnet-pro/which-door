"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { doors, rounds, votes } from "@/db/schema";
import { deleteUpload, UPLOAD_PREFIX } from "@/lib/uploads";

// Espace admin volontairement non verrouillé (pas d'authentification).

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

const doorSchema = z.object({
  label: z.string().trim().min(1, "Le dilemme est obligatoire").max(255),
  description: optionalText,
  revealTitle: optionalText.pipe(z.string().max(255).nullable()),
  revealText: optionalText,
  videoUrl: z
    .string()
    .trim()
    .min(1, "La vidéo est obligatoire")
    .max(1024)
    .refine(
      (value) => value.startsWith(UPLOAD_PREFIX) || z.url({ protocol: /^https?$/ }).safeParse(value).success,
      "URL de vidéo invalide",
    ),
  imageUrl: optionalText.pipe(z.url("URL d'image invalide").max(1024).nullable()),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
});

const roundSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire").max(255),
  active: z.boolean(),
  badSide: z.enum(["left", "right"], "Indique quelle porte est la mauvaise"),
  left: doorSchema,
  right: doorSchema,
});

export type RoundFormState = {
  errors?: Record<string, string>;
  message?: string;
};

function parseRoundForm(formData: FormData) {
  const door = (side: "left" | "right") => ({
    label: String(formData.get(`${side}.label`) ?? ""),
    description: String(formData.get(`${side}.description`) ?? ""),
    revealTitle: String(formData.get(`${side}.revealTitle`) ?? ""),
    revealText: String(formData.get(`${side}.revealText`) ?? ""),
    videoUrl: String(formData.get(`${side}.videoUrl`) ?? ""),
    imageUrl: String(formData.get(`${side}.imageUrl`) ?? ""),
    color: String(formData.get(`${side}.color`) ?? ""),
  });
  return roundSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    active: formData.get("active") === "on",
    badSide: formData.get("badSide") ?? undefined,
    left: door("left"),
    right: door("right"),
  });
}

function toErrors(error: z.ZodError): RoundFormState {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return { errors, message: "Le formulaire contient des erreurs." };
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/play");
}

export async function saveRound(
  roundId: number | null,
  _prev: RoundFormState,
  formData: FormData,
): Promise<RoundFormState> {
  const parsed = parseRoundForm(formData);
  if (!parsed.success) return toErrors(parsed.error);
  const { title, active, badSide, left, right } = parsed.data;
  const previous = roundId === null ? [] : await getDb().select().from(doors).where(eq(doors.roundId, roundId));

  await getDb().transaction(async (tx) => {
    let id = roundId;
    if (id === null) {
      const [{ last }] = await tx.select({ last: max(rounds.position) }).from(rounds);
      const [inserted] = await tx
        .insert(rounds)
        .values({ title, active, badSide, position: (last ?? -1) + 1 })
        .$returningId();
      id = inserted.id;
      await tx.insert(doors).values([
        { ...left, roundId: id, side: "left" },
        { ...right, roundId: id, side: "right" },
      ]);
    } else {
      await tx.update(rounds).set({ title, active, badSide }).where(eq(rounds.id, id));
      for (const [side, door] of [["left", left], ["right", right]] as const) {
        await tx
          .update(doors)
          .set(door)
          .where(and(eq(doors.roundId, id), eq(doors.side, side)));
      }
    }
  });

  // Supprime les vidéos uploadées qui ont été remplacées
  const kept = new Set([left.videoUrl, right.videoUrl]);
  await Promise.all(previous.filter((door) => !kept.has(door.videoUrl ?? "")).map((door) => deleteUpload(door.videoUrl)));

  refresh();
  redirect("/admin");
}

export async function deleteRound(roundId: number) {
  const roundDoors = await getDb().select().from(doors).where(eq(doors.roundId, roundId));
  await getDb().delete(rounds).where(eq(rounds.id, roundId));
  await Promise.all(roundDoors.map((door) => deleteUpload(door.videoUrl)));
  refresh();
}

export async function toggleRound(roundId: number, active: boolean) {
  await getDb().update(rounds).set({ active }).where(eq(rounds.id, roundId));
  refresh();
}

export async function moveRound(roundId: number, direction: "up" | "down") {
  await getDb().transaction(async (tx) => {
    const all = await tx
      .select({ id: rounds.id })
      .from(rounds)
      .orderBy(asc(rounds.position), asc(rounds.id));
    const index = all.findIndex((round) => round.id === roundId);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= all.length) return;

    [all[index], all[target]] = [all[target], all[index]];
    // Renumérote tout pour garder des positions propres et uniques
    for (const [position, round] of all.entries()) {
      await tx.update(rounds).set({ position }).where(eq(rounds.id, round.id));
    }
  });
  refresh();
}

export async function resetVotes(roundId?: number) {
  await getDb().delete(votes).where(roundId ? eq(votes.roundId, roundId) : undefined);
  refresh();
}
