"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Clock,
  Download,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Plus,
  Sparkles,
  Table2,
  Target,
  Users,
} from "lucide-react";
import { AssistantDesk, RiskBoard } from "@/components/assistant-desk";
import { BrandHero } from "@/components/brand-hero";
import { TeamDesk } from "@/components/team-desk";
import { C, EmptyState, GhostButton, NumInput, PrimaryButton, StatTile, TableScroll, TopBar } from "@/components/ui";
import { buildKpis, riskLabel } from "@/lib/kpis";
import {
  achievementColor,
  fmtCr,
  fmtInt,
  fmtLakh,
  initials,
  monthMeta,
  num,
  parseLoose,
  pctChange,
} from "@/lib/format";
import { hasSupabase } from "@/lib/theme";
import { DEMO_BOOK_KEY, activeRms, loadDemoBook, writeDemoBook } from "@/lib/demo-book";
import { leaveDesk, requestBack } from "@/lib/enter-desk";
import { createClient } from "@/lib/supabase/client";
import type {
  AppMode,
  Assignment,
  Certification,
  CoachingNote,
  MonthRow,
  Profile,
  Submission,
} from "@/lib/types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const rowKey = (rm: string, m: string) => `${rm}|${m}`;
type Tab = "dashboard" | "entry" | "certs" | "notes" | "assistant" | "team";

export default function TLConsole({
  profile,
  team: initialTeam,
  months,
  initialSubmissions,
  initialAssignments,
  initialCerts,
  initialNotes,
  mode,
}: {
  profile: Profile;
  team: Profile[];
  months: MonthRow[];
  initialSubmissions: Submission[];
  initialAssignments: Assignment[];
  initialCerts: Certification[];
  initialNotes: CoachingNote[];
  mode: AppMode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [tab, setTab] = useState<Tab>("dashboard");
  const [ask, setAsk] = useState("");
  const [team, setTeam] = useState(initialTeam);
  const [activeMonth, setActiveMonth] = useState(months.length ? months[months.length - 1].id : "");
  const [status, setStatus] = useState("");
  const [flatTarget, setFlatTarget] = useState("");
  const [monthList, setMonthList] = useState(months);

  const [subs, setSubs] = useState<Record<string, Submission>>(() => {
    const map: Record<string, Submission> = {};
    initialSubmissions.forEach((s) => {
      map[rowKey(s.rm_id, s.month_id)] = s;
    });
    return map;
  });
  const [assigns, setAssigns] = useState<Record<string, Assignment>>(() => {
    const map: Record<string, Assignment> = {};
    initialAssignments.forEach((a) => {
      map[rowKey(a.rm_id, a.month_id)] = a;
    });
    return map;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    initialNotes.forEach((n) => {
      map[n.rm_id] = n.note;
    });
    return map;
  });
  const [certMap, setCertMap] = useState<Record<string, Certification>>(() => {
    const map: Record<string, Certification> = {};
    initialCerts.forEach((c) => {
      map[c.rm_id] = c;
    });
    return map;
  });
  const [ready, setReady] = useState(mode !== "demo");

  const monthLabel = monthList.find((m) => m.id === activeMonth)?.label ?? "";
  const monthIdx = monthList.findIndex((m) => m.id === activeMonth);
  const prevMonth = monthIdx > 0 ? monthList[monthIdx - 1] : null;
  const closed = monthList.find((m) => m.id === activeMonth)?.is_open === false;

  async function signOut() {
    if (mode === "live" && hasSupabase()) {
      try {
        await createClient().auth.signOut();
      } catch {
        /* still leave */
      }
    }
    await leaveDesk();
  }

  const tabRef = useRef(tab);
  tabRef.current = tab;

  function openTab(id: Tab) {
    if (id === tabRef.current) return;
    startTransition(() => setTab(id));
    if (id === "dashboard") {
      window.history.replaceState({ ...window.history.state, deskTab: "dashboard" }, "");
    } else {
      window.history.pushState({ ...window.history.state, deskTab: id }, "");
    }
  }

  useEffect(() => {
    window.history.replaceState({ ...window.history.state, deskTab: "dashboard" }, "");
    const onPop = (e: PopStateEvent) => {
      const next = ((e.state as { deskTab?: Tab } | null)?.deskTab ?? "dashboard") as Tab;
      startTransition(() => setTab(next));
    };
    const onBack = (e: Event) => {
      if (tabRef.current === "dashboard") return;
      e.preventDefault();
      const st = window.history.state as { deskTab?: Tab } | null;
      if (st?.deskTab && st.deskTab !== "dashboard") {
        window.history.back();
      } else {
        openTab("dashboard");
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("desk:back", onBack);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("desk:back", onBack);
    };
  }, []);

  useEffect(() => {
    if (mode !== "demo") return;
    const apply = () => {
      const book = loadDemoBook();
      setTeam(activeRms(book));
      setMonthList(book.months);
      const nextSubs: Record<string, Submission> = {};
      book.submissions.forEach((s) => {
        nextSubs[rowKey(s.rm_id, s.month_id)] = s;
      });
      setSubs(nextSubs);
      const nextAssigns: Record<string, Assignment> = {};
      book.assignments.forEach((a) => {
        nextAssigns[rowKey(a.rm_id, a.month_id)] = a;
      });
      setAssigns(nextAssigns);
      const nextCerts: Record<string, Certification> = {};
      book.certs.forEach((c) => {
        nextCerts[c.rm_id] = c;
      });
      setCertMap(nextCerts);
      const nextNotes: Record<string, string> = {};
      book.notes.forEach((n) => {
        nextNotes[n.rm_id] = n.note;
      });
      setNotes(nextNotes);
      if (book.months.length) setActiveMonth(book.months[book.months.length - 1].id);
    };
    apply();
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === DEMO_BOOK_KEY) apply();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mode]);

  useEffect(() => {
    if (mode !== "demo" || !ready) return;
    writeDemoBook({
      v: 1,
      team,
      months: monthList,
      submissions: Object.values(subs),
      assignments: Object.values(assigns),
      certs: Object.values(certMap),
      notes: Object.entries(notes)
        .filter(([, note]) => note.trim())
        .map(([rm_id, note]) => ({ rm_id, note })),
    });
  }, [mode, ready, team, monthList, subs, assigns, certMap, notes]);

  function later(id: string, work: () => Promise<void>) {
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      void work();
    }, 280);
  }

  const rows = useMemo(() => {
    return team
      .map((r) => {
        const s = subs[rowKey(r.id, activeMonth)];
        const a = assigns[rowKey(r.id, activeMonth)];
        const pv = prevMonth ? subs[rowKey(r.id, prevMonth.id)] : undefined;
        const c = certMap[r.id];
        const certVals = [c?.ulip, c?.endowment, c?.term].filter((v) => v !== null && v !== undefined) as number[];
        const target = num(a?.target);
        return {
          id: r.id,
          name: r.full_name,
          ape: num(s?.ape),
          frp: num(s?.frp),
          policies: num(s?.policies),
          target,
          achievement: target ? (num(s?.ape) / target) * 100 : null,
          quality: a?.quality_score ?? null,
          growth: pv ? pctChange(num(s?.ape), num(pv.ape)) : null,
          certAvg: certVals.length ? certVals.reduce((x, y) => x + y, 0) / certVals.length : null,
          submitted: !!s?.submitted_at,
        };
      })
      .sort((a, b) => b.ape - a.ape)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [team, subs, assigns, certMap, activeMonth, prevMonth]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          ape: acc.ape + r.ape,
          frp: acc.frp + r.frp,
          policies: acc.policies + r.policies,
          target: acc.target + r.target,
        }),
        { ape: 0, frp: 0, policies: 0, target: 0 },
      ),
    [rows],
  );

  const pending = rows.filter((r) => !r.submitted);
  const anyTargets = rows.some((r) => r.target > 0);
  const teamAch = totals.target ? (totals.ape / totals.target) * 100 : null;

  const kpiRows = useMemo(
    () =>
      buildKpis({
        team,
        months: monthList,
        submissions: Object.values(subs),
        assignments: Object.values(assigns),
        certs: Object.values(certMap),
        monthId: activeMonth,
      }),
    [team, monthList, subs, assigns, certMap, activeMonth],
  );
  const flagMap = useMemo(() => new Map(kpiRows.map((k) => [k.id, k.flags])), [kpiRows]);

  function askAssistant(query: string) {
    setAsk(query);
    openTab("assistant");
  }

  function saveAssignment(rmId: string, field: "target" | "quality_score", raw: string) {
    const value = parseLoose(raw);
    const k = rowKey(rmId, activeMonth);
    const next: Assignment = {
      ...(assigns[k] ?? { rm_id: rmId, month_id: activeMonth, target: null, quality_score: null }),
      [field]: value,
    };
    setAssigns((s) => ({ ...s, [k]: next }));
    setStatus("Saving…");
    later(k + field, async () => {
      if (mode === "demo") {
        setStatus("Saved");
        return;
      }
      const { error } = await createClient()
        .from("assignments")
        .upsert({
          rm_id: rmId,
          month_id: activeMonth,
          target: next.target,
          quality_score: next.quality_score,
          updated_at: new Date().toISOString(),
        } as never);
      setStatus(error ? "Save failed" : "Saved");
    });
  }

  function saveSubmission(rmId: string, field: "ape" | "frp" | "policies", raw: string) {
    const k = rowKey(rmId, activeMonth);
    if (subs[k]?.submitted_at || closed) return;
    const value = parseLoose(raw);
    const next: Submission = {
      ...(subs[k] ?? {
        rm_id: rmId,
        month_id: activeMonth,
        ape: null,
        frp: null,
        policies: null,
        submitted_at: null,
      }),
      [field]: value,
    };
    setSubs((s) => ({ ...s, [k]: next }));
    setStatus("Saving…");
    later(k + field, async () => {
      if (mode === "demo") {
        setStatus("Saved");
        return;
      }
      const { error } = await createClient()
        .from("submissions")
        .upsert({
          rm_id: rmId,
          month_id: activeMonth,
          ape: next.ape,
          frp: next.frp,
          policies: next.policies,
          submitted_at: next.submitted_at,
          updated_at: new Date().toISOString(),
        } as never);
      setStatus(error ? "Save failed" : "Saved");
    });
  }

  async function applyFlatTarget() {
    const v = parseLoose(flatTarget);
    if (v === null || !activeMonth) return;
    setStatus("Saving…");
    const payload = team.map((r) => ({
      rm_id: r.id,
      month_id: activeMonth,
      target: v,
      quality_score: assigns[rowKey(r.id, activeMonth)]?.quality_score ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (mode !== "demo") {
      const { error } = await createClient().from("assignments").upsert(payload as never);
      if (error) {
        setStatus("Save failed");
        return;
      }
    }
    setAssigns((s) => {
      const next = { ...s };
      team.forEach((r) => {
        const k = rowKey(r.id, activeMonth);
        next[k] = {
          ...(next[k] ?? { rm_id: r.id, month_id: activeMonth, quality_score: null }),
          target: v,
        } as Assignment;
      });
      return next;
    });
    setFlatTarget("");
    setStatus("Saved");
  }

  async function openMonth(mi: number, yy: string) {
    const year = 2000 + Number(yy || "26");
    const meta = monthMeta(year, mi);
    if (mode !== "demo") {
      const { error } = await createClient()
        .from("months")
        .upsert({ id: meta.id, label: meta.label, sort_order: meta.sort_order, is_open: true } as never);
      if (error) {
        setStatus("Could not open month");
        return;
      }
      router.refresh();
      return;
    }
    setMonthList((list) => {
      if (list.some((m) => m.id === meta.id)) return list;
      return [...list, { ...meta, is_open: true }].sort((a, b) => a.sort_order - b.sort_order);
    });
    setActiveMonth(meta.id);
    setStatus("Month opened");
  }

  function saveNote(rmId: string, note: string) {
    setNotes((s) => ({ ...s, [rmId]: note }));
    later(`note-${rmId}`, async () => {
      if (mode === "demo") {
        setStatus("Saved");
        return;
      }
      const { error } = await createClient()
        .from("coaching_notes")
        .upsert({ rm_id: rmId, note, updated_at: new Date().toISOString() } as never);
      setStatus(error ? "Save failed" : "Saved");
    });
  }

  function exportCSV() {
    const lines = [["RM", "Month", "Target", "APE", "FRP", "Policies", "Quality", "Achieved %", "Submitted"].join(",")];
    team.forEach((r) =>
      monthList.forEach((m) => {
        const s = subs[rowKey(r.id, m.id)];
        const a = assigns[rowKey(r.id, m.id)];
        lines.push(
          [
            `"${r.full_name}"`,
            m.label,
            a?.target ?? "",
            s?.ape ?? "",
            s?.frp ?? "",
            s?.policies ?? "",
            a?.quality_score ?? "",
            num(a?.target) ? ((num(s?.ape) / num(a?.target)) * 100).toFixed(0) : "",
            s?.submitted_at ?? "",
          ].join(","),
        );
      }),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rm-productivity.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const NAV = [
    { id: "dashboard" as const, label: "Dashboard", short: "Home", icon: LayoutDashboard },
    { id: "team" as const, label: "Team", short: "Team", icon: Users },
    { id: "assistant" as const, label: "Assistant", short: "AI", icon: Sparkles },
    { id: "entry" as const, label: "Targets & figures", short: "Figures", icon: Table2 },
    { id: "certs" as const, label: "Certifications", short: "Certs", icon: GraduationCap },
    { id: "notes" as const, label: "Coaching notes", short: "Notes", icon: NotebookPen },
  ];

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-30">
      <TopBar
        title="Team Victory"
        subtitle={`Cross Sell · ${team.length} relationship managers${mode === "demo" ? " · preview" : ""}`}
        status={status}
        onSignOut={signOut}
        onBack={tab !== "dashboard" ? () => requestBack() : undefined}
        sticky={false}
        right={
          monthList.length > 0 ? (
              <select
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="desk-btn min-h-11 rounded-lg px-3 py-1.5 text-sm font-medium text-white outline-none"
                style={{ background: C.navyDeep, border: `1px solid ${C.navyMid}` }}
              >
                {monthList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.is_open ? "" : " · closed"}
                  </option>
                ))}
              </select>
          ) : undefined
        }
      />

      <div className="px-3 sm:px-5" style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
        <div data-no-swipe className="no-scrollbar flex gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => openTab(n.id)}
              aria-label={n.label}
              className="desk-nav inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors sm:px-3.5"
              style={{
                color: tab === n.id ? C.heading : C.slate,
                borderBottom: `2px solid ${tab === n.id ? C.gold : "transparent"}`,
                background: tab === n.id ? C.paper : "transparent",
              }}
            >
              <n.icon size={15} />
              <span className="sm:hidden">{n.short}</span>
              <span className="hidden sm:inline">{n.label}</span>
            </button>
          ))}
        </div>
      </div>
      </div>

      <div key={tab} className="desk-panel mx-auto max-w-7xl space-y-4 p-3 safe-bottom sm:space-y-5 sm:p-5">
        {tab === "dashboard" && (
          <BrandHero
            compact
            kicker="Home"
            sub={`${monthLabel} · ${team.length} relationship managers · Kapil Sharma`}
          />
        )}
        {mode === "demo" && tab !== "dashboard" && (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3 text-xs" style={{ background: C.amberBg, color: C.ink }}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Signed in as Kapil Sharma. Edits stay on this browser after you close the tab. Use Team to add or remove RMs.
          </div>
        )}
        {team.length === 0 && (
          <EmptyState
            icon={Users}
            title="No relationship managers yet"
            body="RMs appear here once they sign in for the first time with their work email."
          />
        )}

        {monthList.length === 0 ? (
          <div className="desk-card p-4" style={{ background: C.panel }}>
            <div className="mb-1 text-sm font-semibold" style={{ color: C.ink }}>
              Open your first reporting month
            </div>
            <div className="mb-3 text-xs" style={{ color: C.slate }}>
              Your team can&apos;t submit until a month is open.
            </div>
            <MonthOpener onOpen={openMonth} />
          </div>
        ) : (
          <>
            {tab === "dashboard" &&
              (pending.length > 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-lg px-4 py-3 sm:flex-row" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <Clock size={17} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: C.ink }}>
                    {team.length - pending.length} of {team.length} have submitted for {monthLabel}
                  </div>
                  <div className="mt-0.5 text-sm" style={{ color: C.slate }}>
                    Still waiting on {pending.map((r) => r.name).join(", ")}.
                  </div>
                </div>
                <GhostButton onClick={() => askAssistant("Who hasn't submitted this month?")} icon={Sparkles}>
                  Nudge them
                </GhostButton>
              </div>
            ) : (
              team.length > 0 && (
                <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: C.greenBg, border: `1px solid ${C.greenLine}` }}>
                  <Check size={17} style={{ color: C.green }} />
                  <div className="text-sm font-semibold" style={{ color: C.green }}>
                    Everyone has submitted for {monthLabel}
                  </div>
                </div>
              )
            ))}

            {tab === "dashboard" && (
              <>
                <RiskBoard kpis={kpiRows} monthLabel={monthLabel} onAsk={askAssistant} />
                <div className="flex flex-wrap gap-3">
                  {anyTargets && (
                    <StatTile
                      label={`Target achievement — ${monthLabel}`}
                      value={teamAch === null ? "—" : `${teamAch.toFixed(0)}%`}
                      valueColor={achievementColor(teamAch)}
                      sub={`${fmtCr(totals.ape)} against ${fmtCr(totals.target)}`}
                    />
                  )}
                  <StatTile label={`Team APE — ${monthLabel}`} value={fmtCr(totals.ape)} />
                  <StatTile label={`Team FRP — ${monthLabel}`} value={fmtCr(totals.frp)} />
                  <StatTile label="Policies issued" value={fmtInt(totals.policies)} />
                  <StatTile
                    label="FRP against APE"
                    value={totals.ape ? `${((totals.frp / totals.ape) * 100).toFixed(1)}%` : "—"}
                    sub="premium actually banked"
                  />
                </div>

                <div className="desk-card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: C.ink }}>
                        Leaderboard
                      </div>
                      <div className="text-xs" style={{ color: C.slate }}>
                        Ranked by APE for {monthLabel}
                      </div>
                    </div>
                    <GhostButton onClick={exportCSV} icon={Download}>
                      Export CSV
                    </GhostButton>
                  </div>
                  <TableScroll>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: C.navy }}>
                          {["#", "Relationship manager", "APE", ...(anyTargets ? ["Target", "Achieved"] : []), "FRP", "Policies", "Quality", "MoM", "Cert avg"].map(
                            (h, i) => (
                              <th
                                key={h + i}
                                className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-white"
                                style={{ textAlign: i === 1 ? "left" : i === 0 ? "center" : "right" }}
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.id} className="desk-row" style={{ background: i % 2 ? C.paper : C.panel, borderBottom: `1px solid ${C.lineSoft}` }}>
                            <td className="px-3 py-2 text-center tabular-nums" style={{ color: C.slate }}>
                              {r.rank}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                  style={{
                                    width: 26,
                                    height: 26,
                                    background: r.rank <= 3 ? C.gold : C.lineSoft,
                                    color: r.rank <= 3 ? C.navyDeep : C.slate,
                                  }}
                                >
                                  {initials(r.name)}
                                </span>
                                <div className="min-w-0">
                                  <div className="whitespace-nowrap font-medium" style={{ color: C.ink }}>
                                    {r.name}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap gap-1">
                                    {!r.submitted && (
                                      <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: C.amberBg, color: C.amber }}>
                                        pending
                                      </span>
                                    )}
                                    {(flagMap.get(r.id) ?? [])
                                      .filter((f) => f !== "pending_submission" && f !== "behind_target")
                                      .slice(0, 2)
                                      .map((f) => (
                                        <span key={f} className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: C.redBg, color: C.red }}>
                                          {riskLabel(f)}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">{fmtLakh(r.ape)}</td>
                            {anyTargets && (
                              <>
                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: C.slate }}>
                                  {fmtLakh(r.target)}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: achievementColor(r.achievement) }}>
                                  {r.achievement === null ? "—" : `${r.achievement.toFixed(0)}%`}
                                </td>
                              </>
                            )}
                            <td className="px-3 py-2 text-right tabular-nums">{fmtLakh(r.frp)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{r.policies || "—"}</td>
                            <td
                              className="px-3 py-2 text-right font-semibold tabular-nums"
                              style={{
                                color: r.quality === null ? C.slateLight : r.quality >= 85 ? C.green : r.quality >= 70 ? C.ink : C.red,
                              }}
                            >
                              {r.quality === null ? "—" : r.quality}
                            </td>
                            <td
                              className="px-3 py-2 text-right font-semibold tabular-nums"
                              style={{ color: r.growth === null ? C.slateLight : r.growth >= 0 ? C.green : C.red }}
                            >
                              {r.growth === null ? "—" : `${r.growth >= 0 ? "+" : ""}${r.growth.toFixed(1)}%`}
                            </td>
                            <td
                              className="px-3 py-2 text-right tabular-nums"
                              style={{ color: r.certAvg === null ? C.slateLight : r.certAvg >= 80 ? C.green : r.certAvg >= 65 ? C.ink : C.red }}
                            >
                              {r.certAvg === null ? "—" : r.certAvg.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                </div>
              </>
            )}

            {tab === "team" && (
              <TeamDesk
                team={team}
                onAdded={(rm) => {
                  setTeam((list) => (list.some((r) => r.id === rm.id) ? list.map((r) => (r.id === rm.id ? rm : r)) : [...list, rm]));
                  setStatus(`Added ${rm.full_name}`);
                }}
                onRemoved={(id) => {
                  setTeam((list) => list.filter((r) => r.id !== id));
                  setStatus("RM removed");
                }}
              />
            )}

            {tab === "assistant" && (
              <AssistantDesk monthId={activeMonth} monthLabel={monthLabel} initialQuery={ask} />
            )}

            {tab === "entry" && (
              <div className="space-y-4">
                <div className="desk-card flex flex-wrap items-end gap-4 p-4">
                  <MonthOpener onOpen={openMonth} />
                  <div>
                    <div className="mb-1.5 text-xs" style={{ color: C.slate }}>
                      Same target for everyone
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="w-48">
                        <NumInput
                          value={flatTarget === "" ? null : flatTarget}
                          onChange={setFlatTarget}
                          placeholder="6,00,000 or 6L"
                          kind="inr"
                        />
                      </div>
                      <GhostButton onClick={applyFlatTarget} icon={Target}>
                        Apply to all
                      </GhostButton>
                    </div>
                  </div>
                </div>

                <div className="desk-card overflow-hidden">
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                    <div className="text-sm font-semibold" style={{ color: C.ink }}>
                      {monthLabel}
                      {closed ? " · closed" : ""}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: C.slate }}>
                      You set targets and quality scores. APE, FRP and policies come from each RM and lock after they
                      submit. Amounts use Indian numbering — hundred, thousand, lakh, ten lakh, crore.
                    </div>
                  </div>
                  <TableScroll>
                    <table className="w-full text-sm" style={{ minWidth: 900 }}>
                      <thead>
                        <tr style={{ background: C.navy }}>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-white">Relationship manager</th>
                          {["Target (₹)", "Quality", "APE (₹)", "FRP (₹)", "Policies", "Achieved"].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-right text-xs font-semibold text-white">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {team.map((r, i) => {
                          const s = subs[rowKey(r.id, activeMonth)];
                          const a = assigns[rowKey(r.id, activeMonth)];
                          const ach = num(a?.target) ? (num(s?.ape) / num(a?.target)) * 100 : null;
                          return (
                            <tr key={r.id} className="desk-row" style={{ background: i % 2 ? C.paper : C.panel, borderBottom: `1px solid ${C.lineSoft}` }}>
                              <td className="whitespace-nowrap px-3 py-1.5">
                                <span className="font-medium" style={{ color: C.ink }}>
                                  {r.full_name}
                                </span>
                                {!s?.submitted_at && (
                                  <span className="ml-2 rounded px-1.5 py-0.5 text-xs" style={{ background: C.amberBg, color: C.amber }}>
                                    pending
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5" style={{ width: 130 }}>
                                <NumInput value={a?.target} onChange={(v) => saveAssignment(r.id, "target", v)} placeholder="—" kind="inr" />
                              </td>
                              <td className="px-3 py-1.5" style={{ width: 100 }}>
                                <NumInput value={a?.quality_score} onChange={(v) => saveAssignment(r.id, "quality_score", v)} placeholder="—" kind="count" />
                              </td>
                              {(["ape", "frp", "policies"] as const).map((f) => (
                                <td key={f} className="px-3 py-1.5" style={{ width: 130 }}>
                                  <NumInput
                                    value={s?.[f]}
                                    onChange={(v) => saveSubmission(r.id, f, v)}
                                    placeholder="—"
                                    kind={f === "policies" ? "count" : "inr"}
                                    disabled={Boolean(s?.submitted_at) || closed}
                                  />
                                </td>
                              ))}
                              <td className="px-3 py-1.5 text-right font-semibold tabular-nums" style={{ color: achievementColor(ach), width: 90 }}>
                                {ach === null ? "—" : `${ach.toFixed(0)}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableScroll>
                </div>
              </div>
            )}

            {tab === "certs" && (
              <div className="desk-card overflow-hidden">
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <div className="text-sm font-semibold" style={{ color: C.ink }}>
                    Certification scores
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: C.slate }}>
                    RMs keep these current themselves. Below 70 is flagged.
                  </div>
                </div>
                <TableScroll>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: C.navy }}>
                        {["Relationship manager", "ULIP", "Endowment", "Term", "Average"].map((h, i) => (
                          <th key={h} className="px-3 py-2.5 text-xs font-semibold text-white" style={{ textAlign: i === 0 ? "left" : "right" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {team.map((r, i) => {
                        const c = certMap[r.id];
                        const vals = [c?.ulip, c?.endowment, c?.term].filter((v) => v !== null && v !== undefined) as number[];
                        const avg = vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null;
                        const cell = (v: number | null | undefined) => (
                          <td
                            className="px-3 py-2 text-right tabular-nums"
                            style={{ color: v === null || v === undefined ? C.slateLight : v < 70 ? C.red : C.ink }}
                          >
                            {v === null || v === undefined ? "—" : v}
                          </td>
                        );
                        return (
                          <tr key={r.id} className="desk-row" style={{ background: i % 2 ? C.paper : C.panel, borderBottom: `1px solid ${C.lineSoft}` }}>
                            <td className="whitespace-nowrap px-3 py-2 font-medium" style={{ color: C.ink }}>
                              {r.full_name}
                            </td>
                            {cell(c?.ulip)}
                            {cell(c?.endowment)}
                            {cell(c?.term)}
                            <td className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: C.heading }}>
                              {avg === null ? "—" : avg.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableScroll>
              </div>
            )}

            {tab === "notes" && (
              <div className="grid gap-3">
                <p className="text-xs" style={{ color: C.slate }}>
                  Coaching notes are team-lead only. Row-level security blocks RMs even if they guess the table name.
                </p>
                {team.map((r) => (
                  <div key={r.id} className="desk-card desk-card-hover p-4">
                    <div className="mb-2 text-sm font-medium" style={{ color: C.ink }}>
                      {r.full_name}
                    </div>
                    <textarea
                      value={notes[r.id] ?? ""}
                      onChange={(e) => saveNote(r.id, e.target.value)}
                      rows={3}
                      placeholder="Private coaching note"
                      className="w-full rounded px-3 py-2 text-sm outline-none"
                      style={{ border: `1px solid ${C.line}`, color: C.ink, background: C.panel }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MonthOpener({ onOpen }: { onOpen: (monthIndex: number, yy: string) => void }) {
  const now = new Date();
  const [mi, setMi] = useState(now.getMonth());
  const [yy, setYy] = useState(String(now.getFullYear()).slice(2));
  return (
    <div>
      <div className="mb-1.5 text-xs" style={{ color: C.slate }}>
        Open a reporting month
      </div>
      <div className="flex gap-2">
        <select
          value={mi}
          onChange={(e) => setMi(Number(e.target.value))}
          className="rounded px-2 py-1.5 text-sm outline-none"
          style={{ border: `1px solid ${C.line}`, background: C.panel, color: C.ink }}
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <input
          value={yy}
          onChange={(e) => setYy(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className="w-16 rounded px-2 py-1.5 text-sm tabular-nums outline-none"
          style={{ border: `1px solid ${C.line}`, background: C.panel, color: C.ink }}
        />
        <PrimaryButton onClick={() => onOpen(mi, yy)} icon={Plus}>
          Open
        </PrimaryButton>
      </div>
    </div>
  );
}
