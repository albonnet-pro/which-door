import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getRounds, getVoteCounts } from "@/lib/queries";
import { RoundActions, ResetAllVotes } from "./round-actions";

export default function AdminPage() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Rounds</h1>
          <p className="text-muted">Chaque round propose deux portes. L&apos;ordre ici est l&apos;ordre du jeu.</p>
        </div>
        <div className="flex gap-3">
          <ResetAllVotes />
          <Link
            href="/admin/rounds/new"
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink hover:brightness-110"
          >
            + Nouveau round
          </Link>
        </div>
      </div>
      <Suspense fallback={<p className="text-muted">Chargement…</p>}>
        <RoundList />
      </Suspense>
    </>
  );
}

async function RoundList() {
  await connection();
  const [rounds, counts] = await Promise.all([getRounds(), getVoteCounts()]);

  if (rounds.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted">
        Aucun round. Crée le premier !
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {rounds.map((round, i) => {
        const left = counts[round.left.id] ?? 0;
        const right = counts[round.right.id] ?? 0;
        const total = left + right;
        const leftPercent = total ? Math.round((left / total) * 100) : 50;
        return (
          <li
            key={round.id}
            className={`rounded-xl border border-border bg-surface p-4 ${round.active ? "" : "opacity-60"}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-2xl font-extrabold text-muted tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  {round.title}
                  {!round.active && (
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-normal text-muted">désactivé</span>
                  )}
                </p>
                <p className="text-sm text-muted">{total} vote{total > 1 ? "s" : ""}</p>
              </div>
              <RoundActions
                roundId={round.id}
                active={round.active}
                isFirst={i === 0}
                isLast={i === rounds.length - 1}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["left", "right"] as const).map((side, n) => {
                const door = round[side];
                const votes = side === "left" ? left : right;
                return (
                  <div
                    key={side}
                    className={`flex gap-3 rounded-lg bg-surface-2 p-3 ${round.badSide === side ? "ring-1 ring-danger/60" : ""}`}
                  >
                    <span className="w-1.5 shrink-0 rounded-full" style={{ background: door.color }} />
                    <div className="min-w-0 text-sm">
                      <p className="text-xs tracking-wider text-muted uppercase">
                        Porte {n + 1}
                        {round.badSide === side ? (
                          <span className="ml-2 text-danger">☠ mauvaise</span>
                        ) : (
                          <span className="ml-2 text-emerald-400">✓ bonne</span>
                        )}
                      </p>
                      <p className="font-semibold">{door.label}</p>
                      <p className="text-muted">
                        {door.videoUrl ? "▶ Vidéo" : <span className="text-danger">Pas de vidéo</span>}
                        {door.revealTitle && ` · ${door.revealTitle}`}
                      </p>
                      <p className="mt-1 text-accent tabular-nums">
                        {votes} vote{votes > 1 ? "s" : ""}
                        {total > 0 && ` · ${side === "left" ? leftPercent : 100 - leftPercent} %`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
