"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Sunrise } from "lucide-react";
import { C } from "@/lib/theme";
import { applyIndiaTheme, msUntilIndiaThemeFlip, readThemePref, setThemePref, type ThemePref } from "@/lib/india-day";

const OPTIONS: { id: ThemePref; label: string; Icon: typeof Sun }[] = [
  { id: "auto", label: "Auto", Icon: Sunrise },
  { id: "day", label: "Light", Icon: Sun },
  { id: "night", label: "Dark", Icon: Moon },
];

export function ThemeToggle({ tone = "onNavy" }: { tone?: "onNavy" | "onPaper" }) {
  const [pref, setPref] = useState<ThemePref | null>(null);

  useEffect(() => {
    const sync = () => setPref(readThemePref());
    sync();
    window.addEventListener("tv-theme", sync);
    return () => window.removeEventListener("tv-theme", sync);
  }, []);

  if (!pref) {
    return <div className="min-h-11 min-w-[8.5rem] sm:min-w-[11.5rem]" aria-hidden />;
  }

  const navy = tone === "onNavy";

  return (
    <div
      data-no-swipe
      role="group"
      aria-label="Colour theme"
      className="inline-flex shrink-0 rounded-lg p-0.5"
      style={{
        border: `1px solid ${navy ? C.navyMid : C.line}`,
        background: navy ? C.navyDeep : C.panel,
      }}
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const on = pref === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            aria-label={id === "auto" ? "Auto theme from sunrise and sunset in India" : `${label} theme`}
            onClick={() => setThemePref(id)}
            className="desk-btn inline-flex min-h-10 items-center justify-center gap-1 rounded-md px-1.5 text-[10px] font-medium sm:min-h-11 sm:px-2.5 sm:text-xs"
            style={{
              background: on ? C.gold : "transparent",
              color: on ? C.navyDeep : navy ? C.ice : C.slate,
            }}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function IndiaTheme() {
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      applyIndiaTheme();
      window.clearTimeout(timer);
      if (readThemePref() !== "auto") return;
      timer = window.setTimeout(tick, Math.min(msUntilIndiaThemeFlip(), 2_147_000_000));
    };
    tick();
    const onWake = () => {
      window.clearTimeout(timer);
      tick();
    };
    window.addEventListener("pageshow", onWake);
    window.addEventListener("tv-theme", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", onWake);
      window.removeEventListener("tv-theme", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, []);
  return null;
}
