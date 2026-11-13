"use client";

import { useEffect, useRef, useState } from "react";

const SIZES = { sm: "h-12 w-12", md: "h-40 w-40", lg: "h-64 w-64", fill: "aspect-square w-full" };

/** Cover Art Archive image with a gradient placeholder when no art exists. */
export function Cover({
  mbid,
  title,
  size = "md",
}: {
  mbid: string;
  title: string;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // The image may have failed before hydration attached onError.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) setFailed(true);
  }, []);
  const px = size === "lg" ? 500 : 250;
  return (
    <div
      className={`${SIZES[size]} shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-rose-950 via-orange-950 to-amber-900`}
    >
      {failed ? (
        <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs font-semibold text-white/70">
          {size === "sm" ? "♪" : title}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote art, many redirect hosts
        <img
          ref={img}
          src={`https://coverartarchive.org/release-group/${mbid}/front-${px}`}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
