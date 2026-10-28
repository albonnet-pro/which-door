import Link from "next/link";

export const metadata = { title: "Admin · Y'a quoi derrière la porte ?" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="font-display text-lg font-extrabold">
            🚪 Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/play" className="text-muted hover:text-foreground">
              Jouer
            </Link>
            <Link href="/" className="text-muted hover:text-foreground">
              Accueil
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
