import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { getViewer } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "Tuneboxd", template: "%s · Tuneboxd" },
  description: "Оценивай музыкальные релизы по 90-балльной шкале",
};

async function Header() {
  const viewer = await getViewer();
  return (
    <header className="border-b border-line bg-ink/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight accent-text">
          Tuneboxd
        </Link>
        <form action="/search" className="flex-1">
          <input
            name="q"
            placeholder="Найти альбом, EP, сингл…"
            className="w-full max-w-md rounded-lg border border-line bg-panel px-3 py-1.5 text-sm outline-none focus:border-violet-500"
          />
        </form>
        <nav className="flex items-center gap-4 text-sm">
          {viewer ? (
            <>
              <Link href={`/u/${viewer.username}`} className="font-medium hover:text-violet-300">
                {viewer.display_name || viewer.username}
              </Link>
              <Link href="/settings" className="text-zinc-400 hover:text-zinc-200">
                Настройки
              </Link>
              <form action={signOut}>
                <button className="text-zinc-400 hover:text-zinc-200">Выйти</button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-500"
            >
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen font-sans">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
