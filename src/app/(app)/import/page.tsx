import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/cover";
import { ChevronRightIcon, LastfmIcon } from "@/components/icons";
import { LastfmSettingsForm } from "@/components/lastfm-settings-form";
import { LastfmSync } from "@/components/lastfm-sync";
import { formatShortDate } from "@/lib/format";
import { getSettings, getUnratedListens } from "@/lib/queries";

export const metadata: Metadata = { title: "Last.fm" };
export const maxDuration = 60;

export default async function ImportPage() {
  const [settings, unrated] = await Promise.all([getSettings(), getUnratedListens(50)]);
  const configured = Boolean(settings.lastfm_username && settings.lastfm_api_key);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] text-muted">Интеграция</p>
        <h1 className="mt-0.5 flex items-center gap-2 text-[34px] font-semibold tracking-tight">
          Last.fm <LastfmIcon className="h-7 w-7 text-accent" />
        </h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
          Импортируйте альбомы из своих скробблов. Они появятся в дневнике как прослушанные и будут
          ждать оценки — без ручного поиска каждого релиза.
        </p>
      </header>

      <LastfmSettingsForm
        configured={configured}
        username={settings.lastfm_username}
        apiKey={settings.lastfm_api_key}
      />

      {configured && <LastfmSync lastSync={settings.lastfm_last_sync} />}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[17px] font-semibold">Ждут оценки</h2>
          <span className="text-[12px] text-muted">{unrated.length}</span>
        </div>

        {unrated.length ? (
          <div className="mt-3 divide-y divide-line">
            {unrated.map((item) => (
              <Link
                key={item.release_id}
                href={`/release/${item.mbid}`}
                className="group flex items-center gap-3 py-2.5"
              >
                <Cover mbid={item.mbid} title={item.title} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium leading-tight group-hover:text-accent">
                    {item.title}
                  </div>
                  <div className="truncate text-[12px] text-muted">
                    {item.artist} · {formatShortDate(item.listened_at)}
                  </div>
                </div>
                <span className="hidden rounded-full bg-fill px-2 py-0.5 text-[10px] text-muted sm:inline">
                  {item.source === "lastfm" ? "Last.fm" : "Вручную"}
                </span>
                <span className="text-[12px] font-medium text-accent">Оценить</span>
                <ChevronRightIcon className="h-4 w-4 text-muted/50" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
            {configured
              ? "Всё оценено. Новые прослушивания появятся после синхронизации."
              : "Подключите Last.fm, чтобы импортировать прослушивания."}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[17px] font-semibold">Как это работает</h2>
        <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-muted">
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fill text-[10px] font-semibold text-ink">
              1
            </span>
            Last.fm отдаёт скробблы за выбранный период. Приложение группирует их по альбомам.
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fill text-[10px] font-semibold text-ink">
              2
            </span>
            Каждый альбом сопоставляется с релизом в MusicBrainz — по MBID или поиском по артисту.
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fill text-[10px] font-semibold text-ink">
              3
            </span>
            Релиз добавляется как прослушанный. Оценка не ставится автоматически — это остаётся за
            вами.
          </li>
        </ol>
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
          На Vercel можно включить ежедневную автоматическую синхронизацию: задайте{" "}
          <code className="rounded bg-fill px-1">CRON_SECRET</code> в переменных окружения.
          Расписание уже прописано в <code className="rounded bg-fill px-1">vercel.json</code>.
        </p>
      </section>
    </div>
  );
}
