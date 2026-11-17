"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");

  if (!username || !password) return { error: "Введите имя и пароль" };
  if (!(await verifyCredentials(username, password))) {
    // Slow down brute-force attempts a little.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: "Неверное имя пользователя или пароль" };
  }

  await createSession(username);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}
