"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { C, PrimaryButton } from "@/components/ui";

export function DemoEntry({
  supabaseEnabled,
  embed = false,
}: {
  supabaseEnabled: boolean;
  embed?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"tl" | "rm" | null>(null);

  async function enter(role: "tl" | "rm") {
    setBusy(role);
    await fetch("/api/demo/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    router.push(role === "tl" ? "/tl" : "/rm");
    router.refresh();
  }

  return (
    <div className="mt-5 grid gap-3">
      <PrimaryButton onClick={() => void enter("tl")} disabled={busy !== null}>
        {busy === "tl" ? "Opening…" : "Preview as team lead"}
      </PrimaryButton>
      <button
        type="button"
        onClick={() => void enter("rm")}
        disabled={busy !== null}
        className="rounded-md px-3.5 py-2 text-sm font-medium disabled:opacity-40"
        style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.panel }}
      >
        {busy === "rm" ? "Opening…" : "Preview as relationship manager"}
      </button>
      {embed ? null : supabaseEnabled ? (
        <Link href="/login" className="text-center text-xs underline" style={{ color: C.slate }}>
          Sign in with work email
        </Link>
      ) : (
        <p className="text-xs" style={{ color: C.slateLight }}>
          Magic-link sign-in appears after you add Supabase keys.
        </p>
      )}
    </div>
  );
}
