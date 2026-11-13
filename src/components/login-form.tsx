"use client";

import { useActionState, useState } from "react";
import { signInWithOAuth, signInWithPassword, signUp, type ActionState } from "@/app/actions";

export function LoginForm({
  oauthError,
  providers,
}: {
  oauthError: boolean;
  providers: { google: boolean; spotify: boolean };
}) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<ActionState, FormData>(signInWithPassword, undefined);
  const [upState, upAction, upPending] = useActionState<ActionState, FormData>(signUp, undefined);
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;
  const field = "w-full rounded-lg border border-line bg-black/30 px-3 py-2 outline-none focus:border-accent";

  return (
    <div className="mx-auto max-w-sm space-y-6 rounded-2xl border border-line bg-panel p-6">
      <h1 className="text-2xl font-extrabold">{mode === "in" ? "Вход" : "Регистрация"}</h1>

      {(providers.google || providers.spotify) && (
        <>
          <form action={signInWithOAuth} className="space-y-2">
            {providers.google && (
              <button name="provider" value="google" className="w-full rounded-full border border-line py-2 text-sm hover:border-accent">
                Продолжить с Google
              </button>
            )}
            {providers.spotify && (
              <button name="provider" value="spotify" className="w-full rounded-full border border-line py-2 text-sm hover:border-spotify">
                Продолжить со Spotify
              </button>
            )}
            {oauthError && <p className="text-sm text-red-400">Не удалось войти, попробуйте ещё раз.</p>}
          </form>

          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="h-px flex-1 bg-line" />
            или по email
            <div className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {upState?.ok && mode === "up" ? (
        <p className="text-sm text-success">Мы отправили письмо со ссылкой для подтверждения.</p>
      ) : (
        <form action={mode === "in" ? inAction : upAction} className="space-y-3">
          <input name="email" type="email" required placeholder="Email" autoComplete="email" className={field} />
          <input
            name="password"
            type="password"
            required
            minLength={mode === "up" ? 8 : undefined}
            placeholder="Пароль"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            className={field}
          />
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button disabled={pending} className="w-full rounded-full bg-accent py-2 font-semibold text-black hover:bg-accent-hover disabled:opacity-60">
            {mode === "in" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      )}

      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-sm text-accent hover:underline">
        {mode === "in" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
}
