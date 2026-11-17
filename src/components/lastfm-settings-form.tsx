"use client";

import { useActionState } from "react";
import { clearLastfmSettings, saveLastfmSettings } from "@/lib/actions/lastfm";
import type { ActionState } from "@/lib/action-state";
import { ExternalLinkIcon, KeyIcon, LastfmIcon, UserIcon } from "./icons";

export function LastfmSettingsForm({
  configured,
  username = "",
  apiKey = "",
}: {
  configured: boolean;
  username?: string;
  apiKey?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveLastfmSettings, undefined);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold">Подключение Last.fm</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Нужны username и бесплатный API-ключ. Ключ создаётся на странице Last.fm API за минуту.
          </p>
        </div>
        <LastfmIcon className="h-7 w-7 shrink-0 text-accent" />
      </div>

      {configured && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-medium text-positive">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          Подключено
        </div>
      )}

      <form action={action} className="mt-4 space-y-3">
        <label className="block">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
            <UserIcon className="h-3.5 w-3.5" /> Username
          </span>
          <input
            name="username"
            defaultValue={username}
            required
            autoComplete="username"
            placeholder="например, manekinek0"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
            <KeyIcon className="h-3.5 w-3.5" /> API key
          </span>
          <input
            name="api_key"
            type="password"
            defaultValue={apiKey}
            required
            autoComplete="off"
            placeholder="32-символьный ключ"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-accent"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={pending}
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Проверяю…" : "Сохранить"}
          </button>
          <a
            href="https://www.last.fm/api/account/create"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"
          >
            Получить API-ключ <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
          {state?.ok && <span className="text-[12px] text-positive">{state.message}</span>}
          {state?.error && <span className="text-[12px] text-accent">{state.error}</span>}
        </div>
      </form>

      {configured && (
        <form action={clearLastfmSettings} className="mt-3 border-t border-line pt-3">
          <button className="text-[12px] text-muted hover:text-accent">Отключить Last.fm</button>
        </form>
      )}
    </div>
  );
}
