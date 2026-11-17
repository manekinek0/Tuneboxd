"use client";

import { useEffect, useRef, useState } from "react";
import { MusicNoteIcon } from "./icons";

const SIZES = {
  xs: "h-10 w-10 rounded-[7px]",
  sm: "h-12 w-12 rounded-lg",
  md: "h-40 w-40 rounded-xl",
  lg: "h-64 w-64 rounded-2xl",
  xl: "h-[300px] w-[300px] rounded-2xl",
  fill: "aspect-square w-full rounded-xl",
};

/** Cover Art Archive image with a tasteful placeholder when no art exists. */
export function Cover({
  mbid,
  title,
  size = "md",
  className = "",
  eager = false,
}: {
  mbid: string;
  title: string;
  size?: keyof typeof SIZES;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // The image may have failed before hydration attached onError.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) setFailed(true);
  }, []);

  const px = size === "xl" ? 1200 : size === "lg" || size === "md" ? 500 : 250;

  return (
    <div
      className={`${SIZES[size]} relative shrink-0 overflow-hidden bg-fill shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${className}`}
    >
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 via-fill to-fill text-accent">
          <MusicNoteIcon className={size === "xs" || size === "sm" ? "h-5 w-5" : "h-10 w-10 opacity-70"} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote art, many redirect hosts
        <img
          ref={img}
          src={`https://coverartarchive.org/release-group/${mbid}/front-${px}`}
          alt={title}
          loading={eager ? "eager" : "lazy"}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
