"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, Shield } from "lucide-react";
import { Avatar, C } from "@/components/ui";
import { enterDesk, hardOpen } from "@/lib/enter-desk";

export type DeskPick = { id: string; full_name: string; email: string };

export function DemoEntry({
  supabaseEnabled,
  embed = false,
  teamLead,
  rms,
}: {
  supabaseEnabled: boolean;
  embed?: boolean;
  teamLead: DeskPick;
  rms: DeskPick[];
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const reset = () => setBusy(null);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rms;
    return rms.filter((rm) => `${rm.full_name} ${rm.email}`.toLowerCase().includes(n));
  }, [rms, q]);

  async function enter(id: string, href: "/tl" | "/rm") {
    setBusy(id);
    const watchdog = window.setTimeout(() => setBusy(null), 10000);
    try {
      await enterDesk({ id });
      hardOpen(href);
    } catch {
      window.clearTimeout(watchdog);
      setBusy(null);
    }
  }

  return (
    <div className={embed ? "grid gap-5" : "mt-5 grid gap-5"}>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: C.slateLight }}>
          Team lead
        </p>
        <button
          type="button"
          onClick={() => void enter(teamLead.id, "/tl")}
          disabled={busy !== null}
          className="desk-person flex min-h-14 w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left disabled:opacity-40"
          style={{ border: `1px solid ${C.navy}`, background: C.navy, color: C.onNavy }}
        >
          <Avatar name={teamLead.full_name} gold size={40} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              {busy === teamLead.id ? "Opening console…" : teamLead.full_name}
            </span>
            <span className="mt-0.5 block text-xs" style={{ color: C.ice }}>
              Full book · targets, quality and coaching
            </span>
          </span>
          <ChevronRight size={16} style={{ color: C.gold }} />
        </button>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: C.slateLight }}>
          Relationship managers
        </p>
        {rms.length === 0 ? (
          <p className="text-xs leading-5" style={{ color: C.slate }}>
            No RMs on the book yet. Sign in as {teamLead.full_name} and add people from Team.
          </p>
        ) : (
          <>
            <label className="relative mb-2 block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slateLight }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find an RM by name or email"
                className="desk-input w-full rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none"
                style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.panel }}
              />
            </label>
            <ul className="grid max-h-[min(22rem,46dvh)] gap-2 overflow-y-auto pr-0.5">
              {filtered.map((rm) => (
                <li key={rm.id}>
                  <button
                    type="button"
                    onClick={() => void enter(rm.id, "/rm")}
                    disabled={busy !== null}
                    className="desk-person flex min-h-14 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left disabled:opacity-40"
                    style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.panel }}
                  >
                    <Avatar name={rm.full_name} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{busy === rm.id ? "Opening desk…" : rm.full_name}</span>
                      <span className="block truncate text-xs" style={{ color: C.slate }}>
                        {rm.email}
                      </span>
                    </span>
                    <ChevronRight size={16} style={{ color: C.slateLight }} />
                  </button>
                </li>
              ))}
            </ul>
            {filtered.length === 0 ? (
              <p className="mt-2 text-xs" style={{ color: C.slate }}>
                No match for “{q}”.
              </p>
            ) : null}
          </>
        )}
      </div>
      {embed ? null : supabaseEnabled ? (
        <Link href="/login" className="inline-flex items-center justify-center gap-1.5 text-center text-xs underline" style={{ color: C.slate }}>
          <Shield size={12} />
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
