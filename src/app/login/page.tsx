import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getViewer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getViewer()) redirect("/");
  const { error } = await searchParams;
  return <LoginForm oauthError={error === "oauth"} />;
}
