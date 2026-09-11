"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/components/ui";
import { enterDesk } from "@/lib/enter-desk";

export function DemoSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const isTl = currentId === "demo-tl";
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await enterDesk({ role: isTl ? "rm" : "tl" });
      router.replace(isTl ? "/rm" : "/tl");
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onPointerEnter={() => router.prefetch(isTl ? "/rm" : "/tl")}
      onClick={() => void go()}
      disabled={busy}
      className="desk-btn min-h-11 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
      style={{ background: C.navyDeep, border: `1px solid ${C.navyMid}` }}
    >
      {busy ? "Opening…" : isTl ? "Open RM desk" : "Back to team lead"}
    </button>
  );
}
