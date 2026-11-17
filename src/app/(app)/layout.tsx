import type { ReactNode } from "react";
import { AppNav } from "@/components/nav";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  return (
    <div className="min-h-dvh lg:pl-[260px]">
      <AppNav username={session.username} />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
        {children}
      </main>
    </div>
  );
}
