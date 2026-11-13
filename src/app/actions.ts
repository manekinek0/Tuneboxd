"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CRITERIA, VIBE } from "@/lib/score";
import { createClient, getViewer } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type ActionState = { error?: string; ok?: boolean } | undefined;

// Ratings ----------------------------------------------------------------------

export async function saveRating(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const releaseId = String(form.get("release_id"));
  const mbid = String(form.get("mbid"));

  const values: Record<string, number> = {};
  for (const { key } of [...CRITERIA, VIBE]) {
    const n = Number(form.get(key));
    if (!Number.isInteger(n) || n < 1 || n > 10) return { error: "Оценки должны быть от 1 до 10" };
    values[key] = n;
  }
  const review = String(form.get("review") ?? "").trim();
  if (review.length > 10000) return { error: "Рецензия слишком длинная (максимум 10 000 символов)" };

  const { error } = await supabase.from("ratings").upsert({
    user_id: user.id,
    release_id: releaseId,
    ...values,
    review: review || null,
  });
  if (error) return { error: "Не удалось сохранить оценку" };

  revalidatePath(`/release/${mbid}`);
  return { ok: true };
}

export async function deleteRating(form: FormData) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("ratings")
    .delete()
    .eq("user_id", user.id)
    .eq("release_id", String(form.get("release_id")));
  revalidatePath(`/release/${form.get("mbid")}`);
}

export async function toggleListened(form: FormData) {
  const { supabase, user } = await requireUser();
  const releaseId = String(form.get("release_id"));
  if (form.get("listened") === "1") {
    // Removing a listen also removes the rating, since a rating implies a listen.
    await supabase.from("ratings").delete().eq("user_id", user.id).eq("release_id", releaseId);
    await supabase.from("listens").delete().eq("user_id", user.id).eq("release_id", releaseId);
  } else {
    await supabase.from("listens").insert({ user_id: user.id, release_id: releaseId });
  }
  revalidatePath(`/release/${form.get("mbid")}`);
}

export async function toggleFavouriteTrack(form: FormData) {
  const { supabase, user } = await requireUser();
  const trackId = String(form.get("track_id"));
  if (form.get("favourite") === "1") {
    await supabase.from("favourite_tracks").delete().eq("user_id", user.id).eq("track_id", trackId);
  } else {
    // release_id is overwritten by a trigger from the track itself.
    await supabase
      .from("favourite_tracks")
      .insert({ user_id: user.id, track_id: trackId, release_id: String(form.get("release_id")) });
  }
  revalidatePath(`/release/${form.get("mbid")}`);
}

// Top-10 ------------------------------------------------------------------------

export async function addToTop(form: FormData) {
  const { supabase, user } = await requireUser();
  const releaseId = String(form.get("release_id"));
  const { data } = await supabase
    .from("top_releases")
    .select("release_id")
    .eq("user_id", user.id)
    .order("position");
  const ids = (data ?? []).map((r) => r.release_id);
  if (!ids.includes(releaseId) && ids.length < 10) {
    // An all-time favourite is by definition listened to.
    await supabase
      .from("listens")
      .upsert({ user_id: user.id, release_id: releaseId }, { ignoreDuplicates: true });
    await supabase.rpc("set_top_releases", { release_ids: [...ids, releaseId] });
  }
  revalidatePath(`/release/${form.get("mbid")}`);
}

export async function saveTop(releaseIds: string[]): Promise<ActionState> {
  const { supabase } = await requireUser();
  const viewer = await getViewer();
  const unique = [...new Set(releaseIds)].slice(0, 10);
  const { error } = await supabase.rpc("set_top_releases", { release_ids: unique });
  if (error) return { error: "Не удалось сохранить топ" };
  if (viewer) revalidatePath(`/u/${viewer.username}`);
  return { ok: true };
}

// Follows -----------------------------------------------------------------------

export async function toggleFollow(form: FormData) {
  const { supabase, user } = await requireUser();
  const targetId = String(form.get("profile_id"));
  if (form.get("following") === "1") {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
  } else if (targetId !== user.id) {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
  }
  revalidatePath(`/u/${form.get("username")}`);
}

// Profile -----------------------------------------------------------------------

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const username = String(form.get("username") ?? "").trim();
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "Имя пользователя: 3–24 символа, латиница, цифры и _" };
  }
  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: String(form.get("display_name") ?? "").trim().slice(0, 60) || null,
      bio: String(form.get("bio") ?? "").trim().slice(0, 500) || null,
    })
    .eq("id", user.id);
  if (error) {
    return { error: error.code === "23505" ? "Это имя уже занято" : "Не удалось сохранить профиль" };
  }
  redirect(`/u/${username}`);
}

// Auth --------------------------------------------------------------------------

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}

export async function signInWithPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) return { error: "Неверный email или пароль" };
  redirect("/");
}

export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const password = String(form.get("password"));
  if (password.length < 8) return { error: "Пароль должен быть не короче 8 символов" };
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email")),
    password,
    options: { emailRedirectTo: `${await origin()}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { ok: true }; // Email confirmation required.
  redirect("/settings");
}

export async function signInWithOAuth(form: FormData) {
  const provider = String(form.get("provider"));
  if (provider !== "google" && provider !== "spotify") return;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await origin()}/auth/callback` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
