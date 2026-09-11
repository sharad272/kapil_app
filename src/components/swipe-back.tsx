"use client";

import { useEffect, useRef } from "react";
import { requestBack } from "@/lib/enter-desk";

declare global {
  interface WindowEventMap {
    "desk:back": CustomEvent;
  }
}

function blocked(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, [data-no-swipe]") ||
      target.closest(".overflow-x-auto"),
  );
}

function setSwipe(px: number) {
  document.documentElement.style.setProperty("--swipe-dx", `${Math.max(0, px)}px`);
}

export function SwipeBack() {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const dx = useRef(0);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (blocked(e.target)) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
      dx.current = 0;
    };

    const onMove = (e: TouchEvent) => {
      if (!start.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const mx = t.clientX - start.current.x;
      const my = t.clientY - start.current.y;
      if (Math.abs(my) > 48 && Math.abs(my) > Math.abs(mx)) {
        start.current = null;
        dx.current = 0;
        setSwipe(0);
        return;
      }
      dx.current = mx;
      const edge = start.current.x <= 32;
      const pulling = edge ? Math.max(0, mx) : Math.max(0, -mx);
      setSwipe(Math.min(pulling, 72));
    };

    const onEnd = () => {
      setSwipe(0);
      if (!start.current) return;
      const elapsed = Math.max(Date.now() - start.current.t, 1);
      const mx = dx.current;
      const fromEdge = start.current.x <= 32;
      start.current = null;
      dx.current = 0;
      const velocity = Math.abs(mx) / elapsed;
      const committed = Math.abs(mx) > 72 || (Math.abs(mx) > 48 && velocity > 0.35);
      if (!committed) return;
      const iOSBack = fromEdge && mx > 0;
      const swipeLeft = mx < 0;
      if (iOSBack || swipeLeft) requestBack();
    };

    const reset = () => setSwipe(0);
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    window.addEventListener("pageshow", reset);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
      window.removeEventListener("pageshow", reset);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-50 h-full"
      style={{
        width: "var(--swipe-dx, 0px)",
        background: "linear-gradient(90deg, rgba(201,162,75,0.55), transparent)",
      }}
    />
  );
}
