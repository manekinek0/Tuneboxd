"use client";

import { useSyncExternalStore } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "./icons";

const KEY = "tuneboxd-theme";
const EVENT = "tuneboxd-theme-change";
type Mode = "system" | "light" | "dark";

function systemIsDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyMode(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") {
    delete root.dataset.theme;
    localStorage.removeItem(KEY);
  } else {
    root.dataset.theme = mode;
    localStorage.setItem(KEY, mode);
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function currentMode(): Mode {
  const stored = localStorage.getItem(KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function ThemeButton({ className = "" }: { className?: string }) {
  const toggle = () => {
    const explicit = document.documentElement.dataset.theme;
    const dark = explicit ? explicit === "dark" : systemIsDark();
    applyMode(dark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Переключить светлую или тёмную тему"
      className={`flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-fill hover:text-ink ${className}`}
    >
      <MoonIcon className="theme-moon h-[18px] w-[18px]" />
      <SunIcon className="theme-sun h-[18px] w-[18px]" />
    </button>
  );
}

export function ThemeSegmented() {
  const mode = useSyncExternalStore(subscribe, currentMode, () => "system" as Mode);

  const options: { value: Mode; label: string; icon: typeof SunIcon }[] = [
    { value: "system", label: "Системная", icon: MonitorIcon },
    { value: "light", label: "Светлая", icon: SunIcon },
    { value: "dark", label: "Тёмная", icon: MoonIcon },
  ];

  return (
    <div className="inline-flex rounded-xl bg-fill p-1" role="group" aria-label="Тема оформления">
      {options.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => applyMode(value)}
            className={`flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
