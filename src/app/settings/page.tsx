import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getViewer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">Профиль</h1>
        <Link href="/settings/top" className="text-sm text-violet-300 hover:underline">
          Изменить топ-10 →
        </Link>
      </div>
      <ProfileForm profile={viewer} />
    </div>
  );
}
