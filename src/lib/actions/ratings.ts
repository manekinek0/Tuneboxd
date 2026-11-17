"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { requireSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { CRITERIA, VIBE } from "@/lib/score";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateDiary(mbid?: string) {
  revalidatePath("/");
  revalidatePath("/ratings");
  revalidatePath("/top");
  revalidatePath("/import");
  if (mbid) revalidatePath(`/release/${mbid}`);
}

export async function saveRating(_: ActionState, form: FormData): Promise<ActionState> {
  await requireSession();
  const releaseId = String(form.get("release_id") ?? "");
  const mbid = String(form.get("mbid") ?? "");
  if (!UUID.test(releaseId)) return { error: "Некорректный релиз" };

  const values: Record<string, number> = {};
  for (const { key } of [...CRITERIA, VIBE]) {
    const n = Number(form.get(key));
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      return { error: "Оценки должны быть от 1 до 10" };
    }
    values[key] = n;
  }

  const review = String(form.get("review") ?? "").trim();
  if (review.length > 10000) return { error: "Рецензия слишком длинная (максимум 10 000 символов)" };

  try {
    await getSql()`
      insert into public.ratings (release_id, rhymes, structure, style, individuality, vibe, review)
      values (
        ${releaseId},
        ${values.rhymes},
        ${values.structure},
        ${values.style},
        ${values.individuality},
        ${values.vibe},
        ${review || null}
      )
      on conflict (release_id) do update set
        rhymes = excluded.rhymes,
        structure = excluded.structure,
        style = excluded.style,
        individuality = excluded.individuality,
        vibe = excluded.vibe,
        review = excluded.review
    `;
  } catch {
    return { error: "Не удалось сохранить оценку" };
  }

  revalidateDiary(mbid);
  return { ok: true, message: "Сохранено" };
}

export async function deleteRating(form: FormData): Promise<void> {
  await requireSession();
  const releaseId = String(form.get("release_id") ?? "");
  if (UUID.test(releaseId)) {
    await getSql()`delete from public.ratings where release_id = ${releaseId}`;
  }
  revalidateDiary(String(form.get("mbid") ?? ""));
}

export async function toggleListened(form: FormData): Promise<void> {
  await requireSession();
  const releaseId = String(form.get("release_id") ?? "");
  if (!UUID.test(releaseId)) return;

  if (form.get("listened") === "1") {
    // Removing a listen also removes the rating, since a rating implies a listen.
    await getSql()`delete from public.ratings where release_id = ${releaseId}`;
    await getSql()`delete from public.listens where release_id = ${releaseId}`;
  } else {
    await getSql()`
      insert into public.listens (release_id, source)
      values (${releaseId}, 'manual')
      on conflict (release_id) do nothing
    `;
  }
  revalidateDiary(String(form.get("mbid") ?? ""));
}

export async function toggleFavouriteTrack(form: FormData): Promise<void> {
  await requireSession();
  const trackId = String(form.get("track_id") ?? "");
  const releaseId = String(form.get("release_id") ?? "");
  if (!UUID.test(trackId) || !UUID.test(releaseId)) return;

  if (form.get("favourite") === "1") {
    await getSql()`delete from public.favourite_tracks where track_id = ${trackId}`;
  } else {
    // release_id is overwritten by a trigger from the track itself.
    await getSql()`
      insert into public.favourite_tracks (track_id, release_id)
      values (${trackId}, ${releaseId})
      on conflict (track_id) do nothing
    `;
  }
  revalidateDiary(String(form.get("mbid") ?? ""));
}

export async function addToTop(form: FormData): Promise<void> {
  await requireSession();
  const releaseId = String(form.get("release_id") ?? "");
  if (!UUID.test(releaseId)) return;

  await getSql()`
    insert into public.listens (release_id, source)
    values (${releaseId}, 'manual')
    on conflict (release_id) do nothing
  `;
  await getSql()`
    insert into public.top_releases (position, release_id)
    select coalesce((select max(position) from public.top_releases), 0) + 1, ${releaseId}
    where not exists (select 1 from public.top_releases where release_id = ${releaseId})
      and (select count(*) from public.top_releases) < 10
  `;
  revalidateDiary(String(form.get("mbid") ?? ""));
}

export async function saveTop(releaseIds: string[]): Promise<ActionState> {
  await requireSession();
  const unique = [...new Set(releaseIds)].filter((id) => UUID.test(id)).slice(0, 10);
  const sql = getSql();

  try {
    await sql`delete from public.top_releases`;
    for (const [index, releaseId] of unique.entries()) {
      await sql`
        insert into public.top_releases (position, release_id)
        values (${index + 1}, ${releaseId})
      `;
    }
  } catch {
    return { error: "Не удалось сохранить топ" };
  }

  revalidateDiary();
  return { ok: true, message: "Топ сохранён" };
}
