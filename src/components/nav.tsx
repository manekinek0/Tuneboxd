"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import {
  ChartIcon,
  GearIcon,
  HomeIcon,
  LastfmIcon,
  LogoutIcon,
  MusicNoteIcon,
  SearchIcon,
  StarIcon,
} from "./icons";
import { ThemeButton } from "./theme-toggle";

type Item = { href: string; label: string; icon: typeof HomeIcon };

const LIBRARY: Item[] = [
  { href: "/", label: "Обзор", icon: HomeIcon },
  { href: "/ratings", label: "Рейтинг", icon: ChartIcon },
  { href: "/search", label: "Поиск", icon: SearchIcon },
  { href: "/import", label: "Last.fm", icon: LastfmIcon },
];

const COLLECTION: Item[] = [
  { href: "/top", label: "Топ-10", icon: StarIcon },
  { href: "/settings", label: "Настройки", icon: GearIcon },
];

const MOBILE = [LIBRARY[0], LIBRARY[1], LIBRARY[2], LIBRARY[3], COLLECTION[0]];

function active(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppNav({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* macOS-style sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-line bg-sidebar backdrop-blur-2xl lg:flex">
        <div className="px-5 pb-5 pt-7">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent text-white shadow-sm">
              <MusicNoteIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">Tuneboxd</span>
          </Link>
        </div>

        <div className="px-3">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Медиатека
          </p>
          <nav className="space-y-0.5">
            {LIBRARY.map((item) => {
              const isActive = active(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[9px] px-3 py-2 text-[14px] transition-colors ${
                    isActive
                      ? "bg-fill font-medium text-ink"
                      : "text-ink/80 hover:bg-fill/70 hover:text-ink"
                  }`}
                >
                  <item.icon className={`h-[19px] w-[19px] ${isActive ? "text-accent" : "text-muted"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 px-3">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            Коллекция
          </p>
          <nav className="space-y-0.5">
            {COLLECTION.map((item) => {
              const isActive = active(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[9px] px-3 py-2 text-[14px] transition-colors ${
                    isActive
                      ? "bg-fill font-medium text-ink"
                      : "text-ink/80 hover:bg-fill/70 hover:text-ink"
                  }`}
                >
                  <item.icon className={`h-[19px] w-[19px] ${isActive ? "text-accent" : "text-muted"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-[9px] px-2 py-1.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
              {username.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{username}</span>
            <ThemeButton />
          </div>
          <form action={signOut}>
            <button className="mt-1 flex w-full items-center gap-3 rounded-[9px] px-3 py-2 text-[13px] text-muted transition-colors hover:bg-fill hover:text-ink">
              <LogoutIcon className="h-[18px] w-[18px]" />
              Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* iOS-style mobile header + tab bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-sidebar px-4 py-2.5 backdrop-blur-2xl lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white">
            <MusicNoteIcon className="h-4 w-4" />
          </span>
          <span className="text-[16px] font-semibold tracking-tight">Tuneboxd</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeButton />
          <Link
            href="/settings"
            aria-label="Настройки"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-fill hover:text-ink"
          >
            <GearIcon className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl lg:hidden">
        <div className="flex items-stretch justify-around">
          {MOBILE.map((item) => {
            const isActive = active(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              >
                <item.icon className="h-[22px] w-[22px]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
