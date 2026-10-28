"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteRound, moveRound, resetVotes, toggleRound } from "./actions";

const button =
  "rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40";

export function RoundActions({
  roundId,
  active,
  isFirst,
  isLast,
}: {
  roundId: number;
  active: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<void>) => startTransition(action);

  return (
    <div className="flex flex-wrap gap-1.5" aria-busy={pending}>
      <button type="button" className={button} disabled={pending || isFirst} onClick={() => run(() => moveRound(roundId, "up"))} aria-label="Monter">
        ↑
      </button>
      <button type="button" className={button} disabled={pending || isLast} onClick={() => run(() => moveRound(roundId, "down"))} aria-label="Descendre">
        ↓
      </button>
      <button type="button" className={button} disabled={pending} onClick={() => run(() => toggleRound(roundId, !active))}>
        {active ? "Désactiver" : "Activer"}
      </button>
      <button
        type="button"
        className={button}
        disabled={pending}
        onClick={() => {
          if (confirm("Remettre à zéro les votes de ce round ?")) run(() => resetVotes(roundId));
        }}
      >
        Reset votes
      </button>
      <Link href={`/admin/rounds/${roundId}`} className={button}>
        Modifier
      </Link>
      <button
        type="button"
        className={`${button} text-danger`}
        disabled={pending}
        onClick={() => {
          if (confirm("Supprimer définitivement ce round ?")) run(() => deleteRound(roundId));
        }}
      >
        Supprimer
      </button>
    </div>
  );
}

export function ResetAllVotes() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-40"
      disabled={pending}
      onClick={() => {
        if (confirm("Remettre à zéro tous les votes ?")) startTransition(() => resetVotes());
      }}
    >
      Reset tous les votes
    </button>
  );
}
