"use client";

import { useLinkStatus } from "next/link";

/**
 * Fixed-size spinner shown inside a <Link> while its navigation is pending.
 * Always rendered (invisible when idle) so the link never shifts.
 */
export function LinkPending({ className = "" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      data-pending={pending}
      className={`tb-link-spinner h-3 w-3 ${className}`}
    />
  );
}
