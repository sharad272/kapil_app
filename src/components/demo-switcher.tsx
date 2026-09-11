"use client";

import { useRouter } from "next/navigation";
import { C } from "@/components/ui";

export function DemoSwitcher({ currentId }: { currentId: string }) {
  const router = useRouter();
  const isTl = currentId === "demo-tl";

  async function go() {
    await fetch("/api/demo/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: isTl ? "rm" : "tl" }),
    });
    router.push(isTl ? "/rm" : "/tl");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void go()}
      className="desk-btn min-h-11 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white"
      style={{ background: C.navyDeep, border: `1px solid ${C.navyMid}` }}
    >
      {isTl ? "Open RM desk" : "Back to team lead"}
    </button>
  );
}
