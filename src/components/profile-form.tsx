"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/app/actions";
import type { Profile } from "@/lib/supabase/server";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, undefined);
  const field = "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 outline-none focus:border-accent";
  return (
    <form action={action} className="max-w-lg space-y-4">
      <label className="block text-sm">
        Имя пользователя
        <input name="username" defaultValue={profile.username} required pattern="[a-zA-Z0-9_]{3,24}" className={field} />
        <span className="text-xs text-muted">Латиница, цифры и _, от 3 до 24 символов. Адрес профиля: /u/имя</span>
      </label>
      <label className="block text-sm">
        Отображаемое имя
        <input name="display_name" defaultValue={profile.display_name ?? ""} maxLength={60} className={field} />
      </label>
      <label className="block text-sm">
        О себе
        <textarea name="bio" defaultValue={profile.bio ?? ""} maxLength={500} rows={4} className={field} />
      </label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-full bg-accent px-4 py-2 font-semibold text-black hover:bg-accent-hover disabled:opacity-60">
          Сохранить
        </button>
        {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
      </div>
    </form>
  );
}
