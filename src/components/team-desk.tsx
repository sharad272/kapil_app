"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { C, GhostButton, PrimaryButton } from "@/components/ui";
import { initials } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function TeamDesk({
  team,
  onAdded,
  onRemoved,
}: {
  team: Profile[];
  onAdded: (rm: Profile) => void;
  onRemoved: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ full_name: name, email }),
      });
      const data = (await res.json()) as { rm?: Profile; error?: string };
      if (!res.ok || !data.rm) {
        setError(data.error || "Could not add that RM");
        return;
      }
      onAdded(data.rm);
      setName("");
      setEmail("");
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not remove that RM");
        return;
      }
      onRemoved(id);
      setPending(null);
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="desk-card p-5">
        <div className="mb-1 text-sm font-semibold" style={{ color: C.ink }}>
          Add a relationship manager
        </div>
        <p className="mb-4 text-xs leading-5" style={{ color: C.slate }}>
          They land on the book immediately — targets, figures and the assistant will include them.
        </p>
        <label className="mb-1 block text-xs" style={{ color: C.slate }}>
          Full name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Neha Kapoor"
          className="desk-input mb-3 w-full rounded-lg px-3 py-2 outline-none"
          style={{ border: `1px solid ${C.line}`, color: C.ink }}
        />
        <label className="mb-1 block text-xs" style={{ color: C.slate }}>
          Work email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="neha.kapoor@atlaslife.in"
          className="desk-input mb-4 w-full rounded-lg px-3 py-2 outline-none"
          style={{ border: `1px solid ${C.line}`, color: C.ink }}
        />
        <PrimaryButton onClick={() => void add()} icon={UserPlus} disabled={busy || name.trim().length < 2 || !email.includes("@")}>
          {busy ? "Saving…" : "Add to the book"}
        </PrimaryButton>
        {error ? (
          <p className="mt-3 text-xs" style={{ color: C.red }}>
            {error}
          </p>
        ) : null}
      </div>

      <div className="desk-card overflow-hidden">
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>
            {team.length} on the book
          </div>
          <div className="text-xs" style={{ color: C.slate }}>
            Remove someone and they drop off the leaderboard, assistant and inbox routing.
          </div>
        </div>
        {team.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm" style={{ color: C.slate }}>
            No relationship managers yet. Add the first name on the left.
          </p>
        ) : (
          <ul>
            {team.map((rm) => (
              <li
                key={rm.id}
                className="desk-row flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ background: C.lineSoft, color: C.navy }}
                  >
                    {initials(rm.full_name)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium" style={{ color: C.ink }}>
                      {rm.full_name}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: C.slate }}>
                      {rm.email}
                    </div>
                  </div>
                </div>
                {pending === rm.id ? (
                  <div className="flex gap-2">
                    <GhostButton danger onClick={() => void remove(rm.id)} disabled={busy}>
                      Confirm remove
                    </GhostButton>
                    <GhostButton onClick={() => setPending(null)}>Cancel</GhostButton>
                  </div>
                ) : (
                  <GhostButton danger icon={Trash2} onClick={() => setPending(rm.id)}>
                    Remove
                  </GhostButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
