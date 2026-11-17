"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { requireSession } from "@/lib/auth";
import { deleteSetting, setSetting } from "@/lib/queries";
import { validateLastfm, syncLastfm } from "@/lib/lastfm";
import type { SyncResult } from "@/lib/types";

export async function saveLastfmSettings(_: ActionState, form: FormData): Promise<ActionState> {
  await requireSession();
  const username = String(form.get("username") ?? "").trim();
  const apiKey = String(form.get("api_key") ?? "").trim();

  if (!username || !apiKey) return { error: "Заполните username и API-ключ" };

  try {
    await validateLastfm(apiKey, username);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `Last.fm: ${error.message}`
          : "Не удалось проверить ключ. Проверьте username и API-ключ.",
    };
  }

  await setSetting("lastfm_username", username);
  await setSetting("lastfm_api_key", apiKey);
  revalidatePath("/import");
  revalidatePath("/settings");
  return { ok: true, message: "Last.fm подключён" };
}

export async function clearLastfmSettings(): Promise<void> {
  await requireSession();
  await deleteSetting("lastfm_username");
  await deleteSetting("lastfm_api_key");
  await deleteSetting("lastfm_last_sync");
  revalidatePath("/import");
  revalidatePath("/settings");
}

export async function syncLastfmAction(periodDays: number): Promise<SyncResult> {
  await requireSession();
  const period = [1, 7, 30].includes(periodDays) ? periodDays : 1;
  const result = await syncLastfm(period);
  revalidatePath("/");
  revalidatePath("/ratings");
  revalidatePath("/import");
  revalidatePath("/top");
  return result;
}
