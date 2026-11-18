import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 10.5 12 3l8.5 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
    </Svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function WaveformIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 10.5v3" />
      <path d="M6.5 7.5v9" />
      <path d="M10 4.5v15" />
      <path d="M13.5 8v8" />
      <path d="M17 5.5v13" />
      <path d="M20.5 9.5v5" />
    </Svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
    </Svg>
  );
}

export function StarFilledIcon(props: IconProps) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
    </Svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </Svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Svg>
  );
}

export function MusicNoteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 18V5.5l11-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="15.5" r="2.5" />
    </Svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20.5s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8 3.3c0 5.5-8 10.4-8 10.4Z" />
    </Svg>
  );
}

export function HeartFilledIcon(props: IconProps) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="M12 20.5s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8 3.3c0 5.5-8 10.4-8 10.4Z" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m9 5 7 7-7 7" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m15 5-7 7 7 7" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 9 7 7 7-7" />
    </Svg>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 15 7-7 7 7" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 13h9.4l.8-13" />
      <path d="M10 11v5M14 11v5" />
    </Svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4h6v6" />
      <path d="m20 4-8.5 8.5" />
      <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </Svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 20h16" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 11A8 8 0 0 0 5.6 6.6L4 8.2" />
      <path d="M4 4v4.2h4.2" />
      <path d="M4 13a8 8 0 0 0 14.4 4.4l1.6-1.6" />
      <path d="M20 20v-4.2h-4.2" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </Svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="15" r="3.5" />
      <path d="m10.5 12.5 8-8M16 7l2 2M18.5 4.5l2 2" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </Svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="M8 5.5v13l10-6.5Z" />
    </Svg>
  );
}

export function SpotifyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1 .25c-2.9-1.77-6.5-2.17-10.8-1.19a.75.75 0 1 1-.33-1.46c4.67-1.07 8.68-.61 11.88 1.35.36.22.47.69.25 1.05Zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.3-2.03-8.35-2.62-12.26-1.43a.94.94 0 1 1-.55-1.8c4.47-1.36 10.02-.7 13.79 1.62.44.27.58.85.31 1.3Zm.13-3.4C15.14 8.28 8.6 8.07 4.8 9.22a1.13 1.13 0 1 1-.65-2.16c4.36-1.32 11.6-1.07 16.17 1.64a1.13 1.13 0 0 1-1.16 1.94Z" />
    </svg>
  );
}

/** Official Last.fm brand mark: white "as" ligature on the red tile. */
export function LastfmIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect width="24" height="24" rx="5" fill="#d41107" />
      <svg
        x="3.5"
        y="7.25"
        width="17"
        height="9.5"
        viewBox="41.8359605 38.7307419 164.5614215 91.4212471"
      >
        <path
          fill="#fff"
          d="M114.409975,120.16185 L108.377185,103.763408 C108.377185,103.763408 98.5740818,114.696666 83.8733992,114.696666 C70.8654217,114.696666 61.6292017,103.386449 61.6292017,85.2895233 C61.6292017,62.1043724 73.3149337,53.8105501 84.8150748,53.8105501 C101.401997,53.8105501 106.680147,64.5553286 111.204378,78.31578 L117.237168,97.1659013 C123.267791,115.449862 134.578008,130.151989 167.187859,130.151989 C190.563656,130.151989 206.397382,122.989766 206.397382,104.141089 C206.397382,88.872079 197.724434,80.9544937 181.513749,77.1841805 L169.450336,74.5454669 C161.157236,72.6606714 158.707001,69.2673173 158.707001,63.6122087 C158.707001,57.2031819 163.795227,53.433591 172.090494,53.433591 C181.138234,53.433591 186.038702,56.826945 186.793343,64.9322877 L205.642742,62.669811 C204.134906,45.7052073 192.448451,38.7307419 173.220649,38.7307419 C156.256767,38.7307419 139.668401,45.1397687 139.668401,65.6862059 C139.668401,78.5042595 145.888948,86.6103244 161.53275,90.3799154 L174.35297,93.3955882 C183.96615,95.6580649 187.168858,99.6161354 187.168858,105.082764 C187.168858,112.055786 180.383594,114.883701 167.56554,114.883701 C148.526939,114.883701 140.610798,104.893563 136.085845,91.1331114 L129.865298,72.2844344 C121.949879,47.7792045 109.319583,38.7307419 84.2481918,38.7307419 C56.5395317,38.7307419 41.8359605,56.2607842 41.8359605,86.0434415 C41.8359605,114.696666 56.5395317,130.151989 82.9302793,130.151989 C104.22919,130.151989 114.409975,120.16185 114.409975,120.16185 Z"
        />
      </svg>
    </svg>
  );
}
