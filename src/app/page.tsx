import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="flex items-end gap-4" aria-hidden>
        {["#b91c1c", "#1d4ed8"].map((color, i) => (
          <div key={color} className="door w-24 sm:w-32">
            <div className="door-frame">
              <div className="door-behind" />
              <div className="door-leaf" style={{ "--door-color": color, cursor: "default" } as React.CSSProperties}>
                <span className="absolute inset-x-0 top-[18%] z-10 text-center font-display text-3xl font-extrabold text-white/90">
                  {i + 1}
                </span>
                <span className="door-knob" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h1 className="font-display text-5xl leading-none font-extrabold text-balance sm:text-7xl">
          Y&apos;a quoi derrière <span className="text-accent">la porte</span> ?
        </h1>
        <p className="text-lg text-balance text-muted">
          Deux portes, deux dilemmes. Tu choisis, on ouvre… et tu découvres ce que tu as gagné. Ou raté.
        </p>
      </div>

      <Link
        href="/play"
        className="rounded-full bg-accent px-10 py-4 font-display text-xl font-bold text-accent-ink shadow-[0_15px_40px_-12px] shadow-accent transition hover:scale-105 hover:brightness-110"
      >
        Jouer
      </Link>

      <Link href="/admin" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
        Espace admin
      </Link>
    </main>
  );
}
