import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getRounds } from "@/lib/queries";
import { Game } from "./game";

export const metadata = { title: "Jouer · Y'a quoi derrière la porte ?" };

export default function PlayPage() {
  return (
    <Suspense fallback={<p className="m-auto text-muted">Les portes arrivent…</p>}>
      <PlayableGame />
    </Suspense>
  );
}

async function PlayableGame() {
  await connection();
  const rounds = await getRounds({ activeOnly: true });

  if (rounds.length === 0) {
    return (
      <div className="m-auto flex flex-col items-center gap-4 px-4 text-center">
        <p className="font-display text-2xl font-bold">Aucune porte à ouvrir pour l&apos;instant.</p>
        <Link href="/admin" className="text-accent underline underline-offset-4">
          Configurer des rounds dans l&apos;admin
        </Link>
      </div>
    );
  }

  return <Game rounds={rounds} />;
}
