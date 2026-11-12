import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TopEditor } from "@/components/top-editor";
import { createClient, getViewer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Мой топ-10" };

type Release = { id: string; mbid: string; title: string; artist: string };

export default async function TopSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const supabase = await createClient();

  const [{ data: top }, { data: listens }, { data: ratings }] = await Promise.all([
    supabase.from("top_releases").select("position, releases(id, mbid, title, artist)").eq("user_id", viewer.id).order("position"),
    supabase.from("listens").select("releases(id, mbid, title, artist)").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(5000),
    supabase.from("ratings").select("release_id, score").eq("user_id", viewer.id),
  ]);
  const scores = new Map((ratings ?? []).map((r) => [r.release_id, r.score]));
  const toItem = (r: Release) => ({ ...r, score: scores.get(r.id) ?? null });

  const candidates = (listens ?? [])
    .map((l) => l.releases as unknown as Release)
    .filter(Boolean)
    .map(toItem)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Топ-10 релизов всех времён</h1>
      <TopEditor
        username={viewer.username}
        initial={(top ?? []).map((t) => toItem(t.releases as unknown as Release))}
        candidates={candidates}
      />
    </div>
  );
}
