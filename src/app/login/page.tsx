import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getViewer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Вход" };

/** OAuth buttons appear only for providers enabled in Supabase Auth. */
async function enabledProviders() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      next: { revalidate: 300 },
    });
    const { external } = (await res.json()) as { external?: Record<string, boolean> };
    return { google: !!external?.google, spotify: !!external?.spotify };
  } catch {
    return { google: false, spotify: false };
  }
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getViewer()) redirect("/");
  const [{ error }, providers] = await Promise.all([searchParams, enabledProviders()]);
  return <LoginForm oauthError={error === "oauth"} providers={providers} />;
}
