"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Sparkles } from "lucide-react";
import { C, GhostButton, PrimaryButton } from "@/components/ui";
import { huddleBrief } from "@/lib/assistant-rules";
import { enterDesk, hardOpen, timedFetch } from "@/lib/enter-desk";
import { riskLabel } from "@/lib/kpis";
import { mergeNotices, readLocalNotices, upsertLocalNotices } from "@/lib/notice-cache";
import { fmtLakh } from "@/lib/format";
import type { AssistantMatch, AssistantResult, DeskNotice, NoticePriority, RmKpi } from "@/lib/types";

const CHIPS = [
  "Who hasn't submitted this month?",
  "Who is below 80% of APE target?",
  "Certifications below 70",
  "Quality watch list",
  "Month-on-month APE declined",
  "Who should I call today?",
];

export function RiskBoard({
  kpis,
  monthLabel,
  onAsk,
}: {
  kpis: RmKpi[];
  monthLabel: string;
  onAsk: (query: string) => void;
}) {
  const brief = huddleBrief(kpis, monthLabel);
  const ranked = [...kpis].filter((k) => k.flags.length).sort((a, b) => b.flags.length - a.flags.length);
  if (!ranked.length) {
    return (
      <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: C.greenBg, border: `1px solid ${C.greenLine}` }}>
        <Check size={16} style={{ color: C.green }} className="mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-semibold" style={{ color: C.green }}>
            Clean book this month
          </div>
          <div className="mt-0.5 text-xs" style={{ color: C.ink }}>
            {brief}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="desk-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold" style={{ color: C.ink }}>
            Morning huddle
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5" style={{ color: C.slate }}>
            {brief}
          </p>
        </div>
        <GhostButton onClick={() => onAsk("Who should I call today?")} icon={Sparkles}>
          Ask the assistant
        </GhostButton>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ranked.slice(0, 6).map((rm) => (
          <button
            key={rm.id}
            type="button"
            onClick={() => onAsk(`Nudge ${rm.name}`)}
            className="desk-chip rounded-lg px-2.5 py-1.5 text-left"
            style={{ background: C.amberBg, border: `1px solid ${C.amberLine}` }}
          >
            <div className="text-xs font-semibold" style={{ color: C.ink }}>
              {rm.name.split(" ")[0]}
            </div>
            <div className="text-[11px]" style={{ color: C.amber }}>
              {rm.flags.slice(0, 2).map(riskLabel).join(" · ")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AssistantDesk({
  monthId,
  monthLabel,
  initialQuery,
}: {
  monthId: string;
  monthLabel: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState<"huggingface" | "groq" | "rules" | "checking">("checking");
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<NoticePriority>("normal");
  const [sent, setSent] = useState<DeskNotice[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void timedFetch("/api/assistant", {}, 6000)
      .then((r) => r.json())
      .then((data: { enabled?: boolean; provider?: "huggingface" | "groq" | "rules" }) => {
        setLink(data.provider ?? (data.enabled ? "huggingface" : "rules"));
      })
      .catch(() => setLink("rules"));
  }, []);

  useEffect(() => {
    if (!initialQuery) return;
    setQuery(initialQuery);
    void (async () => {
      setBusy(true);
      setError("");
      try {
        const res = await timedFetch(
          "/api/assistant",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query: initialQuery, monthId }),
          },
          18000,
        );
        const data = (await res.json()) as AssistantResult & { error?: string };
        if (!res.ok) {
          setError(data.error || "Could not filter the book");
          return;
        }
        setResult(data);
        const sel: Record<string, boolean> = {};
        const msgs: Record<string, string> = {};
        data.matches.forEach((m) => {
          sel[m.id] = true;
          msgs[m.id] = m.message;
        });
        setSelected(sel);
        setMessages(msgs);
        setTitle((t) => t || `Check-in · ${monthLabel}`);
      } catch {
        setError("Network error — try again");
      } finally {
        setBusy(false);
      }
    })();
  }, [initialQuery, monthId, monthLabel]);

  useEffect(() => {
    setSent(readLocalNotices());
    void timedFetch("/api/notifications", {}, 6000)
      .then((r) => r.json())
      .then((data: { notices?: DeskNotice[] }) => {
        if (data.notices) {
          upsertLocalNotices(data.notices);
          setSent(mergeNotices(readLocalNotices(), data.notices));
        }
      })
      .catch(() => undefined);
  }, []);

  const picked = useMemo(() => result?.matches.filter((m) => selected[m.id]) ?? [], [result, selected]);

  async function run(nextQuery = query) {
    const q = nextQuery.trim();
    if (q.length < 3) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const res = await timedFetch(
        "/api/assistant",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: q, monthId }),
        },
        18000,
      );
      const data = (await res.json()) as AssistantResult & { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not filter the book");
        return;
      }
      setResult(data);
      const sel: Record<string, boolean> = {};
      const msgs: Record<string, string> = {};
      data.matches.forEach((m) => {
        sel[m.id] = true;
        msgs[m.id] = m.message;
      });
      setSelected(sel);
      setMessages(msgs);
      if (!title) setTitle(`Check-in · ${monthLabel}`);
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!picked.length) return;
    setSending(true);
    setError("");
    try {
      const reasons: Record<string, string> = {};
      const per: Record<string, string> = {};
      picked.forEach((m) => {
        reasons[m.id] = m.reason;
        per[m.id] = messages[m.id] || m.message;
      });
      const res = await timedFetch(
        "/api/notifications",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            rmIds: picked.map((m) => m.id),
            title: title || `Check-in · ${monthLabel}`,
            body: picked[0] ? messages[picked[0].id] || picked[0].message : "",
            query,
            reasons,
            messages: per,
            priority,
            monthId,
          }),
        },
        8000,
      );
      const data = (await res.json()) as { notices?: DeskNotice[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Could not send");
        return;
      }
      const created = data.notices ?? [];
      upsertLocalNotices(created);
      setSent(mergeNotices(created, readLocalNotices()));
      setStatus(`Sent to ${created.length} RM${created.length === 1 ? "" : "s"}`);
    } catch {
      setError("Network error — try again");
    } finally {
      setSending(false);
    }
  }

  async function openRm(id: string) {
    try {
      await enterDesk({ id });
      hardOpen("/rm");
    } catch {
      setError("Could not open that desk — try again");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <div className="desk-card p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: C.ink }}>
            <Sparkles size={16} style={{ color: C.gold }} />
            Filter the book in plain English
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: link === "rules" || link === "checking" ? C.lineSoft : C.greenBg,
                color: link === "huggingface" || link === "groq" ? C.green : C.slate,
              }}
            >
              {link === "checking"
                ? "Checking model…"
                : link === "huggingface"
                  ? "Hugging Face on"
                  : link === "groq"
                    ? "Groq fallback on"
                    : "Desk rules only"}
            </span>
          </div>
          <p className="mb-3 text-xs" style={{ color: C.slate }}>
            The model only sees this month&apos;s KPIs. It returns people already on your roster — then you send an in-app
            notice they will see on their desk.
          </p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void run();
            }}
            rows={3}
            placeholder="e.g. Who hasn't submitted, and who is below 80% of target?"
            className="desk-input w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.panel }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setQuery(chip);
                  void run(chip);
                }}
                className="desk-chip min-h-11 rounded-full px-3 py-2 text-xs"
                style={{ border: `1px solid ${C.line}`, color: C.slate, background: C.paper }}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={() => void run()} icon={Sparkles} disabled={busy || query.trim().length < 3}>
              {busy ? "Reading the book…" : "Find matching RMs"}
            </PrimaryButton>
            {result ? (
              <span className="text-xs" style={{ color: C.slate }}>
                {sourceLabel(result.source)} · {result.matches.length} match
                {result.matches.length === 1 ? "" : "es"}
              </span>
            ) : null}
          </div>
          {error ? (
            <p className="mt-2 text-xs" style={{ color: C.red }}>
              {error}
            </p>
          ) : null}
        </div>

        {result ? (
          <div className="desk-card overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="text-sm font-semibold" style={{ color: C.ink }}>
                {result.interpretation}
              </div>
              {result.brief ? (
                <p className="mt-1 text-xs leading-5" style={{ color: C.slate }}>
                  {result.brief}
                </p>
              ) : null}
            </div>
            {result.matches.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: C.slate }}>
                Nobody on the roster matches that request.
              </p>
            ) : (
              <ul>
                {result.matches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    checked={!!selected[m.id]}
                    message={messages[m.id] ?? m.message}
                    onToggle={() => setSelected((s) => ({ ...s, [m.id]: !s[m.id] }))}
                    onMessage={(v) => setMessages((s) => ({ ...s, [m.id]: v }))}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="desk-card p-4">
          <div className="mb-3 text-sm font-semibold" style={{ color: C.ink }}>
            Send in-app notices
          </div>
          <label className="mb-1 block text-xs" style={{ color: C.slate }}>
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-3 w-full rounded px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${C.line}`, color: C.ink }}
            placeholder={`Check-in · ${monthLabel}`}
          />
          <label className="mb-1 block text-xs" style={{ color: C.slate }}>
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value === "high" ? "high" : "normal")}
            className="mb-4 w-full rounded px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.panel }}
          >
            <option value="normal">Normal</option>
            <option value="high">High — show as urgent on the RM desk</option>
          </select>
          <PrimaryButton onClick={() => void send()} disabled={sending || !picked.length} tone="gold">
            {sending ? "Sending…" : `Notify ${picked.length} RM${picked.length === 1 ? "" : "s"}`}
          </PrimaryButton>
          {status ? (
            <p className="mt-2 text-xs" style={{ color: C.green }}>
              {status}
            </p>
          ) : (
            <p className="mt-2 text-xs" style={{ color: C.slateLight }}>
              They will see this in their inbox — including the preview RM desk.
            </p>
          )}
          {picked[0] ? (
            <button
              type="button"
              onClick={() => void openRm(picked[0].id)}
              className="mt-3 block text-xs underline"
              style={{ color: C.heading }}
            >
              Open {picked[0].name.split(" ")[0]}&apos;s inbox (preview)
            </button>
          ) : null}
        </div>

        <div className="desk-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
            <Bell size={14} style={{ color: C.gold }} />
            <div className="text-sm font-semibold" style={{ color: C.ink }}>
              Sent
            </div>
          </div>
          {sent.length === 0 ? (
            <p className="px-4 py-6 text-xs" style={{ color: C.slate }}>
              Nothing sent yet this session.
            </p>
          ) : (
            <ul>
              {sent.slice(0, 12).map((n) => (
                <li key={n.id} className="px-4 py-2.5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: C.ink }}>
                      {n.rm_name}
                    </span>
                    <span className="text-[11px]" style={{ color: n.ack_at ? C.green : C.slateLight }}>
                      {n.ack_at ? "acknowledged" : n.read_at ? "read" : "unread"}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px]" style={{ color: C.slate }}>
                    {n.title}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function sourceLabel(source: AssistantResult["source"]) {
  if (source === "huggingface") return "Hugging Face";
  if (source === "groq") return "Groq fallback";
  return "Desk rules";
}

function MatchRow({
  match,
  checked,
  message,
  onToggle,
  onMessage,
}: {
  match: AssistantMatch;
  checked: boolean;
  message: string;
  onToggle: () => void;
  onMessage: (v: string) => void;
}) {
  const k = match.kpis;
  return (
    <li className="desk-row px-4 py-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium" style={{ color: C.ink }}>
              {match.name}
            </span>
            <span className="text-xs tabular-nums" style={{ color: C.slate }}>
              {fmtLakh(k.ape)} APE
              {k.achievementPct !== null ? ` · ${k.achievementPct.toFixed(0)}%` : ""}
            </span>
          </div>
          <div className="mt-1 text-xs" style={{ color: C.slate }}>
            {match.reason}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {k.flags.map((f) => (
              <span key={f} className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: C.amberBg, color: C.amber }}>
                {riskLabel(f)}
              </span>
            ))}
          </div>
          <textarea
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded px-2 py-1.5 text-xs outline-none"
            style={{ border: `1px solid ${C.line}`, color: C.ink }}
          />
        </div>
      </label>
    </li>
  );
}
