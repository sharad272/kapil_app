"use client";

import { useEffect } from "react";
import { applyIndiaTheme, msUntilIndiaThemeFlip } from "@/lib/india-day";

export function IndiaTheme() {
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      applyIndiaTheme();
      timer = window.setTimeout(tick, Math.min(msUntilIndiaThemeFlip(), 2_147_000_000));
    };
    tick();
    const onWake = () => {
      window.clearTimeout(timer);
      tick();
    };
    window.addEventListener("pageshow", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, []);
  return null;
}
