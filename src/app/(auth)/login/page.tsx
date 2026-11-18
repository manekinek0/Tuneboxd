import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { ThemeButton } from "@/components/theme-toggle";
import { authIsConfigured, configuredUsername, getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  if (await getSession()) redirect("/");

  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18%] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px]" />
      </div>

      <div className="absolute right-4 top-4">
        <ThemeButton />
      </div>

      <div className="rise relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-14 w-14 shadow-[0_10px_30px_rgba(250,45,72,0.35)]" />
          <h1 className="mt-4 text-[28px] font-semibold tracking-tight">Tuneboxd</h1>
          <p className="mt-1 text-[13px] text-muted">Личный музыкальный дневник</p>
        </div>

        <LoginForm next={nextPath} username={configuredUsername()} configured={authIsConfigured()} />

        <p className="mt-5 text-center text-[11px] text-muted">
          Оценки, рецензии, любимые треки и топ-10 — всё в одном месте.
        </p>
      </div>
    </div>
  );
}
