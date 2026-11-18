/**
 * Tuneboxd brand mark: a tuning fork on a red squircle. The tuning fork nods
 * to "tune" and stays readable from a 16px favicon to the login screen.
 *
 * The tile uses a solid fill rather than a gradient: the mark is rendered more
 * than once per page, and duplicate SVG gradient ids make some browsers drop
 * the fill for the visible copy.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8.5" fill="#fa2d48" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.75"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <g
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.5 7.5v9a5.5 5.5 0 0 0 11 0v-9" />
        <path d="M16 22v4.5" />
      </g>
    </svg>
  );
}
