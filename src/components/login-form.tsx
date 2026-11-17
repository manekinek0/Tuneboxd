"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/action-state";

export function LoginForm({
  next,
  username,
  configured,
}: {
  next: string;
  username: string;
  configured: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, undefined);

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-[19px] font-semibold">Вход</h2>
      <p className="mt-1 text-[13px] text-muted">Только для владельца дневника.</p>

      {!configured ? (
        <div className="mt-4 rounded-xl bg-accent-soft px-3 py-2.5 text-[12px] leading-relaxed">
          Пароль не настроен. Добавьте <code className="rounded bg-fill px-1">APP_PASSWORD</code> или{" "}
          <code className="rounded bg-fill px-1">APP_PASSWORD_HASH</code> в переменные окружения.
        </div>
      ) : (
        <form action={action} className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="text-[12px] font-medium text-muted">Имя пользователя</span>
            <input
              name="username"
              defaultValue={username}
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[15px] outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-muted">Пароль</span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[15px] outline-none focus:border-accent"
            />
          </label>
          {state?.error && <p className="text-[13px] text-accent">{state.error}</p>}
          <button
            disabled={pending}
            className="mt-1 w-full rounded-full bg-accent py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Вхожу…" : "Войти"}
          </button>
        </form>
      )}
    </div>
  );
}
