import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Door } from "@/db/schema";
import { getRound } from "@/lib/queries";
import { RoundForm, type DoorValues } from "../../round-form";

export default function EditRoundPage({ params }: PageProps<"/admin/rounds/[id]">) {
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold">Modifier le round</h1>
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        <EditRound params={params} />
      </Suspense>
    </>
  );
}

async function EditRound({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const round = Number.isInteger(id) && id > 0 ? await getRound(id) : null;
  if (!round) notFound();

  const toValues = (door: Door): DoorValues => ({
    label: door.label,
    description: door.description ?? "",
    revealTitle: door.revealTitle ?? "",
    revealText: door.revealText ?? "",
    videoUrl: door.videoUrl ?? "",
    imageUrl: door.imageUrl ?? "",
    color: door.color,
  });

  return (
    <RoundForm
      key={round.id}
      roundId={round.id}
      initial={{
        title: round.title,
        active: round.active,
        badSide: round.badSide,
        left: toValues(round.left), right: toValues(round.right) }}
    />
  );
}
