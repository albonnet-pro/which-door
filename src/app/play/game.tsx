"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Door } from "@/components/door";
import type { Door as DoorRow } from "@/db/schema";
import type { RoundWithDoors } from "@/lib/queries";
import { vote } from "./actions";

type Side = "left" | "right";
// choose → opening (la porte s'ouvre) → video (on regarde) → result (bonne/mauvaise porte)
type Phase = "choose" | "opening" | "video" | "result";
type Choice = { round: RoundWithDoors; side: Side; percent: number | null };

const OTHER: Record<Side, Side> = { left: "right", right: "left" };

export function Game({ rounds }: { rounds: RoundWithDoors[] }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("choose");
  const [chosen, setChosen] = useState<Side | null>(null);
  const [counts, setCounts] = useState<Record<number, number> | null>(null);
  const [history, setHistory] = useState<Choice[]>([]);
  const [replay, setReplay] = useState<DoorRow | null>(null);
  const [, startTransition] = useTransition();

  const round = rounds[index];
  if (!round) {
    return (
      <Recap
        history={history}
        onRestart={() => {
          setHistory([]);
          setIndex(0);
        }}
      />
    );
  }

  function choose(side: Side) {
    if (phase !== "choose") return;
    setChosen(side);
    setPhase("opening");

    const door = round[side];
    startTransition(async () => {
      const [result] = await Promise.all([
        vote({ roundId: round.id, doorId: door.id }).catch(() => null),
        // Laisse le temps à la porte de s'ouvrir avant de lancer la vidéo
        new Promise((resolve) => setTimeout(resolve, 1400)),
      ]);
      const nextCounts = result && "counts" in result ? result.counts : null;
      setCounts(nextCounts);
      setHistory((prev) => [...prev, { round, side, percent: percentFor(door, round, nextCounts) }]);
      setPhase(door.videoUrl ? "video" : "result");
    });
  }

  function next() {
    setReplay(null);
    setIndex((i) => i + 1);
    setPhase("choose");
    setChosen(null);
    setCounts(null);
  }

  const isOpen = (side: Side) => (side === chosen && phase !== "choose") || phase === "result";
  const isResult = phase === "result" && chosen !== null;
  const won = isResult && round.badSide !== chosen;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-sm font-bold tracking-widest text-muted uppercase hover:text-foreground">
          ← Accueil
        </Link>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted tabular-nums">
          Round {index + 1} / {rounds.length}
        </span>
      </header>

      <h1 className="mb-2 text-center font-display text-3xl font-extrabold text-balance sm:text-5xl">{round.title}</h1>
      <p className="mb-8 text-center text-muted">
        {phase === "choose"
          ? "Choisis une porte."
          : phase === "video"
            ? "Regarde ce qu'il y avait derrière…"
            : phase === "result"
              ? "Le verdict est tombé."
              : "Ouverture…"}
      </p>

      {isResult && <Verdict won={won} />}

      {phase === "video" && chosen && round[chosen].videoUrl ? (
        <VideoStage
          key={`${round.id}-${chosen}`}
          door={round[chosen]}
          mustFinish
          onContinue={() => setPhase("result")}
        />
      ) : (
        <div key={round.id} className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-4 sm:gap-10">
          {(["left", "right"] as const).map((side, i) => {
            const door = round[side];
            return (
              <Door
                key={side}
                number={(i + 1) as 1 | 2}
                label={door.label}
                description={door.description}
                color={door.color}
                open={isOpen(side)}
                dimmed={isResult && side !== chosen}
                disabled={phase !== "choose"}
                onOpen={() => choose(side)}
                behind={
                  <Behind
                    door={door}
                    bad={isResult ? round.badSide === side : null}
                    percent={isResult ? percentFor(door, round, counts) : null}
                  />
                }
              />
            );
          })}
        </div>
      )}

      {isResult && (
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-balance">
            Tu as choisi <strong className="text-accent">{round[chosen].label}</strong>
            {(() => {
              const percent = percentFor(round[chosen], round, counts);
              return percent === null ? "." : `, comme ${percent} % des joueurs.`;
            })()}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {round[OTHER[chosen]].videoUrl && (
              <button
                type="button"
                onClick={() => setReplay(round[OTHER[chosen]])}
                className="rounded-full border border-border px-6 py-3 font-display font-bold hover:bg-surface"
              >
                ▶ Voir l&apos;autre porte
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-accent px-8 py-3 font-display text-lg font-bold text-accent-ink shadow-[0_10px_30px_-10px] shadow-accent transition hover:brightness-110"
            >
              {index + 1 < rounds.length ? "Round suivant →" : "Voir le récap"}
            </button>
          </div>
        </div>
      )}

      {isResult && replay?.videoUrl && (
        <div className="mt-10">
          <VideoStage key={replay.id} door={replay} onContinue={() => setReplay(null)} />
        </div>
      )}
    </div>
  );
}

function percentFor(door: DoorRow, round: RoundWithDoors, counts: Record<number, number> | null) {
  if (!counts) return null;
  const total = (counts[round.left.id] ?? 0) + (counts[round.right.id] ?? 0);
  if (total === 0) return null;
  return Math.round(((counts[door.id] ?? 0) / total) * 100);
}

function Verdict({ won }: { won: boolean }) {
  return (
    <div
      className={`verdict mx-auto mb-8 rounded-2xl px-8 py-4 text-center font-display text-3xl font-extrabold tracking-wide uppercase shadow-2xl sm:text-5xl ${
        won ? "bg-emerald-500 text-emerald-950 shadow-emerald-500/30" : "bg-danger text-white shadow-red-500/30"
      }`}
      role="status"
    >
      {won ? "✓ Bonne porte !" : "☠ Mauvaise porte…"}
    </div>
  );
}

function VideoStage({
  door,
  mustFinish = false,
  onContinue,
}: {
  door: DoorRow;
  mustFinish?: boolean;
  onContinue: () => void;
}) {
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const canContinue = !mustFinish || ended || failed;
  const [muted, setMuted] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // À l'affichage : amène la vidéo à l'écran (à nouveau quand ses dimensions sont connues) et la lance. Si le navigateur
  // bloque la lecture avec le son, on la lance en muet (bouton pour réactiver).
  const reveal = () => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  useEffect(() => {
    reveal();
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      video.muted = true;
      setMuted(true);
      video.play().catch(() => {});
    });
  }, []);

  return (
    <section
      ref={ref}
      className="mx-auto flex w-full max-w-4xl scroll-m-4 flex-col items-center gap-5"
    >
      <p className="text-center font-display text-xl font-bold text-balance sm:text-2xl">
        Derrière la porte « {door.label} »
      </p>
      <video
        ref={videoRef}
        src={door.videoUrl ?? undefined}
        preload="auto"
        playsInline
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onLoadedMetadata={reveal}
        onEnded={() => setEnded(true)}
        onError={() => setFailed(true)}
        className="max-h-[min(70dvh,calc(100dvh-15rem))] w-auto max-w-full touch-pan-y rounded-xl bg-black shadow-2xl"
      />
      {muted && (
        <button
          type="button"
          onClick={() => {
            if (videoRef.current) videoRef.current.muted = false;
            setMuted(false);
          }}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-surface"
        >
          🔇 Activer le son
        </button>
      )}
      {failed && <p className="text-danger">La vidéo n&apos;a pas pu être lue.</p>}
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue}
        className="rounded-full bg-accent px-8 py-3 font-display text-lg font-bold whitespace-nowrap text-accent-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted"
      >
        {canContinue ? (mustFinish ? "Continuer →" : "Fermer la vidéo") : "Regarde jusqu'au bout…"}
      </button>
    </section>
  );
}

function Behind({ door, bad, percent }: { door: DoorRow; bad: boolean | null; percent: number | null }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-2 py-3 pr-3 pl-[24%] text-center sm:gap-3 sm:py-5 sm:pr-5">
      {door.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- URL libre saisie dans l'admin
        <img src={door.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      )}
      {bad !== null && (
        <p
          className={`relative rounded-full px-3 py-1 font-display text-xs font-bold uppercase sm:text-sm ${
            bad ? "bg-danger text-white" : "bg-emerald-500 text-emerald-950"
          }`}
        >
          {bad ? "☠ Mauvaise" : "✓ Bonne"}
        </p>
      )}
      {door.revealTitle && (
        <p className="relative font-display text-[clamp(0.95rem,2.6vw,1.6rem)] leading-tight font-extrabold text-balance">
          {door.revealTitle}
        </p>
      )}
      {door.revealText && (
        <p className="relative text-[clamp(0.7rem,1.8vw,0.95rem)] leading-snug text-balance opacity-80">{door.revealText}</p>
      )}
      {percent !== null && (
        <p className="relative mt-1 rounded-full bg-black/80 px-3 py-1 font-display text-sm font-bold text-accent tabular-nums sm:text-base">
          {percent} %
        </p>
      )}
    </div>
  );
}

function Recap({ history, onRestart }: { history: Choice[]; onRestart: () => void }) {
  const score = history.filter(({ round, side }) => round.badSide !== side).length;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-12 text-center">
      <h1 className="font-display text-4xl font-extrabold sm:text-6xl">C&apos;est fini !</h1>
      <p className="mt-3 text-lg text-muted">
        <strong className="font-display text-3xl text-accent tabular-nums">
          {score} / {history.length}
        </strong>{" "}
        bonne{score > 1 ? "s" : ""} porte{score > 1 ? "s" : ""}
      </p>

      <ol className="mt-10 w-full space-y-3 text-left">
        {history.map(({ round, side, percent }, i) => {
          const bad = round.badSide === side;
          return (
            <li key={round.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
              <span className="font-display text-2xl font-extrabold text-muted tabular-nums">{i + 1}</span>
              <span className="h-10 w-2 shrink-0 rounded-full" style={{ background: round[side].color }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{round.title}</p>
                <p className="font-semibold">{round[side].label}</p>
                <p className={`text-sm ${bad ? "text-danger" : "text-emerald-400"}`}>
                  {bad ? "☠ Mauvaise porte" : "✓ Bonne porte"}
                </p>
              </div>
              {percent !== null && <span className="text-sm text-muted tabular-nums">{percent} %</span>}
            </li>
          );
        })}
      </ol>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-accent px-8 py-3 font-display text-lg font-bold text-accent-ink transition hover:brightness-110"
        >
          Rejouer
        </button>
        <Link href="/" className="rounded-full border border-border px-8 py-3 font-display text-lg font-bold hover:bg-surface">
          Accueil
        </Link>
      </div>
    </div>
  );
}
