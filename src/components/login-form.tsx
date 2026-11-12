"use client";

import { useActionState, useState } from "react";
import { signInWithOAuth, signInWithPassword, signUp, type ActionState } from "@/app/actions";

export function LoginForm({ oauthError }: { oauthError: boolean }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<ActionState, FormData>(signInWithPassword, undefined);
  const [upState, upAction, upPending] = useActionState<ActionState, FormData>(signUp, undefined);
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;
  const field = "w-full rounded-lg border border-line bg-black/30 px-3 py-2 outline-none focus:border-violet-500";

  return (
    <div className="mx-auto max-w-sm space-y-6 rounded-2xl border border-line bg-panel p-6">
      <h1 className="text-2xl font-extrabold">{mode === "in" ? "Вход" : "Регистрация"}</h1>

      <form action={signInWithOAuth} className="space-y-2">
        <button name="provider" value="google" className="w-full rounded-lg border border-line py-2 text-sm hover:border-violet-500">
          Продолжить с Google
        </button>
        <button name="provider" value="spotify" className="w-full rounded-lg border border-line py-2 text-sm hover:border-emerald-500">
          Продолжить со Spotify
        </button>
        {oauthError && <p className="text-sm text-red-400">Этот способ входа пока не настроен.</p>}
      </form>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <div className="h-px flex-1 bg-line" />
        или по email
        <div className="h-px flex-1 bg-line" />
      </div>

      {upState?.ok && mode === "up" ? (
        <p className="text-sm text-emerald-400">Мы отправили письмо со ссылкой для подтверждения.</p>
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
          <button disabled={pending} className="w-full rounded-lg bg-violet-600 py-2 font-medium text-white hover:bg-violet-500 disabled:opacity-60">
            {mode === "in" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      )}

      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-sm text-violet-300 hover:underline">
        {mode === "in" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div>
  );
}
