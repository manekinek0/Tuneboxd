import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon, LogoutIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { LastfmSettingsForm } from "@/components/lastfm-settings-form";
import { ThemeSegmented } from "@/components/theme-toggle";
import { signOut } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { getDiaryStats, getSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const [session, settings, stats] = await Promise.all([getSession(), getSettings(), getDiaryStats()]);
  const configured = Boolean(settings.lastfm_username && settings.lastfm_api_key);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-muted">Приложение</p>
        <h1 className="mt-0.5 text-[34px] font-semibold tracking-tight">Настройки</h1>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[17px] font-semibold">Аккаунт</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-[16px] font-semibold text-accent">
            {(session?.username ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <div className="text-[14px] font-medium">{session?.username}</div>
            <div className="text-[12px] text-muted">Единственный владелец дневника</div>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Пароль и имя пользователя задаются переменными окружения{" "}
          <code className="rounded bg-fill px-1 py-0.5">APP_USERNAME</code>,{" "}
          <code className="rounded bg-fill px-1 py-0.5">APP_PASSWORD_HASH</code> (или{" "}
          <code className="rounded bg-fill px-1 py-0.5">APP_PASSWORD</code>) на Vercel. После
          изменения значений сделайте redeploy.
        </p>
        <form action={signOut} className="mt-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-[12px] text-muted transition-colors hover:border-accent hover:text-accent">
            <LogoutIcon className="h-4 w-4" /> Выйти
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[17px] font-semibold">Оформление</h2>
        <p className="mt-1 text-[12px] text-muted">Тема интерфейса. По умолчанию — как в системе.</p>
        <div className="mt-3">
          <ThemeSegmented />
        </div>
      </section>

      <LastfmSettingsForm
        configured={configured}
        username={settings.lastfm_username}
        apiKey={settings.lastfm_api_key}
      />

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[17px] font-semibold">Данные</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          В дневнике {stats.ratings_count} оценок, {stats.listens_count} прослушанных релизов и{" "}
          {stats.favourites_count} любимых треков. Экспорт содержит релизы, треклисты, оценки,
          прослушивания и топ-10 в JSON.
        </p>
        <a
          href="/api/export"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-fill px-3.5 py-1.5 text-[12px] font-medium transition-colors hover:bg-fill-strong"
        >
          <DownloadIcon className="h-4 w-4" /> Скачать JSON
        </a>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <div>
            <h2 className="text-[17px] font-semibold">Tuneboxd</h2>
            <p className="text-[11px] text-muted">Версия 0.2 · личный музыкальный дневник</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Next.js, Neon Postgres, MusicBrainz и Last.fm. Оценка — 90-балльная шкала: четыре
          критерия × 1,4 × множитель вайба.
        </p>
        <Link href="/top" className="mt-3 inline-block text-[12px] text-accent hover:underline">
          Изменить топ-10 →
        </Link>
      </section>
    </div>
  );
}
