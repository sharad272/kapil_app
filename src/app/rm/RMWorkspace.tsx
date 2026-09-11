"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Clock, Send } from "lucide-react";
import { BrandHero } from "@/components/brand-hero";
import { Inbox } from "@/components/inbox";
import { C, EmptyState, NumInput, PrimaryButton, StatTile, TopBar } from "@/components/ui";
import { achievementColor, fmtLakh, num, parseLoose, whenText } from "@/lib/format";
import { hasSupabase } from "@/lib/theme";
import { leaveDesk } from "@/lib/enter-desk";
import { DEMO_BOOK_KEY, loadDemoBook, writeDemoBook } from "@/lib/demo-book";
import { createClient } from "@/lib/supabase/client";
import type { AppMode, Assignment, Certification, MonthRow, Profile, Submission } from "@/lib/types";

const ApeChart = dynamic(() => import("@/components/ape-chart"), {
  ssr: false,
  loading: () => <div className="h-[220px] animate-pulse rounded-lg" style={{ background: C.lineSoft }} />,
});

export default function RMWorkspace({
  profile,
  months,
  initialSubmissions,
  assignments,
  initialCerts,
  mode,
}: {
  profile: Profile;
  months: MonthRow[];
  initialSubmissions: Submission[];
  assignments: Assignment[];
  initialCerts: Certification | null;
  mode: AppMode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [subs, setSubs] = useState<Record<string, Submission>>(() => {
    const map: Record<string, Submission> = {};
    initialSubmissions.forEach((s) => {
      map[s.month_id] = s;
    });
    return map;
  });
  const [certs, setCerts] = useState<Certification>(
    initialCerts ?? { rm_id: profile.id, ulip: null, endowment: null, term: null },
  );
  const [monthList, setMonthList] = useState(months);
  const [assignRows, setAssignRows] = useState(assignments);
  const [activeMonth, setActiveMonth] = useState(months.length ? months[months.length - 1].id : "");
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(mode !== "demo");

  const assignMap = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignRows.forEach((a) => {
      map[a.month_id] = a;
    });
    return map;
  }, [assignRows]);

  useEffect(() => {
    if (mode !== "demo") return;
    const apply = () => {
      const book = loadDemoBook();
      const mine = book.submissions.filter((s) => s.rm_id === profile.id);
      const map: Record<string, Submission> = {};
      mine.forEach((s) => {
        map[s.month_id] = s;
      });
      setSubs(map);
      setMonthList(book.months);
      setAssignRows(book.assignments.filter((a) => a.rm_id === profile.id));
      const cert = book.certs.find((c) => c.rm_id === profile.id);
      if (cert) setCerts(cert);
      if (book.months.length) setActiveMonth(book.months[book.months.length - 1].id);
    };
    apply();
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === DEMO_BOOK_KEY) apply();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mode, profile.id]);

  useEffect(() => {
    if (mode !== "demo" || !ready) return;
    const book = loadDemoBook();
    writeDemoBook({
      ...book,
      submissions: [...book.submissions.filter((s) => s.rm_id !== profile.id), ...Object.values(subs)],
      assignments: [...book.assignments.filter((a) => a.rm_id !== profile.id), ...assignRows],
      certs: [...book.certs.filter((c) => c.rm_id !== profile.id), certs],
    });
  }, [mode, ready, subs, assignRows, certs, profile.id]);

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

  function later(id: string, work: () => Promise<void>) {
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      void work();
    }, 280);
  }

  async function persistSubmission(next: Submission) {
    if (mode === "demo") {
      setStatus("Saved");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("submissions").upsert({
      rm_id: profile.id,
      month_id: next.month_id,
      ape: next.ape,
      frp: next.frp,
      policies: next.policies,
      submitted_at: next.submitted_at,
      updated_at: new Date().toISOString(),
    } as never);
    setStatus(error ? "Save failed" : "Saved");
  }

  if (monthList.length === 0) {
    return (
      <div>
        <TopBar
          title={`Hello, ${profile.full_name.split(" ")[0]}`}
          subtitle="Submit your monthly figures"
          onSignOut={signOut}
        />
        <div className="mx-auto max-w-4xl space-y-4 p-3 safe-bottom sm:p-5">
          <BrandHero compact kicker="Home" sub={`Your figures · ${profile.full_name}`} />
          <Inbox rmId={profile.id} />
          <EmptyState
            icon={Clock}
            title="No reporting month is open yet"
            body="Your team lead opens each month before figures can be entered. Check back shortly."
          />
        </div>
      </div>
    );
  }

  const cur = subs[activeMonth] ?? {
    rm_id: profile.id,
    month_id: activeMonth,
    ape: null,
    frp: null,
    policies: null,
    submitted_at: null,
  };
  const assign = assignMap[activeMonth];
  const target = assign?.target ?? null;
  const quality = assign?.quality_score ?? null;
  const achievement = target ? (num(cur.ape) / num(target)) * 100 : null;
  const remaining = target ? num(target) - num(cur.ape) : null;
  const closed = monthList.find((m) => m.id === activeMonth)?.is_open === false;
  const weakCerts = (
    [
      { label: "ULIP", v: certs.ulip },
      { label: "Endowment", v: certs.endowment },
      { label: "Term", v: certs.term },
    ] as const
  ).filter((c) => c.v !== null && c.v !== undefined && c.v < 70);

  function saveField(field: "ape" | "frp" | "policies", raw: string) {
    if (closed || cur.submitted_at) return;
    const value = parseLoose(raw);
    const next = { ...cur, [field]: value };
    setSubs((s) => ({ ...s, [activeMonth]: next }));
    setStatus("Saving…");
    later(field, () => persistSubmission(next));
  }

  function saveCert(field: "ulip" | "endowment" | "term", raw: string) {
    const value = parseLoose(raw);
    const next = { ...certs, [field]: value };
    setCerts(next);
    setStatus("Saving…");
    later(`cert-${field}`, async () => {
      if (mode === "demo") {
        setStatus("Saved");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.from("certifications").upsert({
        rm_id: profile.id,
        ulip: next.ulip,
        endowment: next.endowment,
        term: next.term,
        updated_at: new Date().toISOString(),
      } as never);
      setStatus(error ? "Save failed" : "Saved");
    });
  }

  async function submitMonth() {
    const next = { ...cur, submitted_at: new Date().toISOString() };
    setSubs((s) => ({ ...s, [activeMonth]: next }));
    await persistSubmission(next);
    setStatus("Submitted");
    if (mode !== "demo") {
      startTransition(() => router.refresh());
    }
  }

  const chartData = monthList.map((m) => {
    const s = subs[m.id];
    const a = assignMap[m.id];
    return {
      month: m.label,
      APE: Number((num(s?.ape) / 100000).toFixed(1)),
      Target: Number((num(a?.target) / 100000).toFixed(1)),
    };
  });

  const CERT_FIELDS = [
    { key: "ulip" as const, label: "ULIP", color: C.navy },
    { key: "endowment" as const, label: "Endowment", color: C.gold },
    { key: "term" as const, label: "Term", color: C.teal },
  ];

  return (
    <div className="min-h-dvh">
      <TopBar
        title={`Hello, ${profile.full_name.split(" ")[0]}`}
        subtitle="Submit your monthly figures and keep your certification scores current"
        status={status}
        onSignOut={signOut}
        right={
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
        }
      />

      <div className="mx-auto max-w-4xl space-y-4 p-3 safe-bottom sm:p-5">
        <BrandHero
          compact
          kicker="Home"
          sub={`${monthList.find((m) => m.id === activeMonth)?.label ?? "Your desk"} · ${profile.full_name}`}
        />
        <Inbox rmId={profile.id} />
        {mode === "demo" && (
          <div className="rounded-lg px-4 py-3 text-xs" style={{ background: C.amberBg, color: C.ink }}>
            Figures, submits and scores stay on this browser. Close the tab and open it again — your last save is still here.
          </div>
        )}
        {closed && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.slate }}>
            This month is closed. You can still read your figures; new writes are blocked.
          </div>
        )}
        {cur.submitted_at && (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: C.greenBg, border: `1px solid ${C.greenLine}` }}>
            <Check size={16} style={{ color: C.green }} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: C.green }}>
                Submitted
              </div>
              <div className="mt-0.5 text-xs" style={{ color: C.ink }}>
                Sent to your team lead on {whenText(cur.submitted_at)}. These figures are locked.
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <StatTile label="Your APE" value={fmtLakh(num(cur.ape))} />
          <StatTile
            label="Your target"
            value={target ? fmtLakh(num(target)) : "not set yet"}
            sub={target ? undefined : "your team lead sets this"}
          />
          <StatTile
            label="Achieved"
            value={achievement === null ? "—" : `${achievement.toFixed(0)}%`}
            valueColor={achievementColor(achievement)}
          />
          <StatTile
            label="Still to go"
            value={remaining === null ? "—" : remaining <= 0 ? "over target" : fmtLakh(remaining)}
            sub={remaining !== null && remaining > 0 ? "APE vs your target" : undefined}
            valueColor={remaining !== null && remaining > 0 ? C.amber : C.green}
          />
          <StatTile label="Quality score" value={quality === null ? "—" : quality} sub="assigned by your team lead" />
        </div>

        <div className="desk-card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
            <div className="text-sm font-semibold" style={{ color: C.ink }}>
              Your figures
            </div>
            <div className="mt-0.5 text-xs" style={{ color: C.slate }}>
              Enter APE and FRP in rupees. Commas follow Indian numbering as you type — hundred, thousand, lakh, ten
              lakh, crore. You can also type 5L or 1Cr. After you submit, the figures lock.
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            {(
              [
                { key: "ape" as const, label: "Annualised premium equivalent (₹)", kind: "inr" as const },
                { key: "frp" as const, label: "First-year rated premium (₹)", kind: "inr" as const },
                { key: "policies" as const, label: "Policies issued", kind: "count" as const },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <div className="mb-1.5 text-xs" style={{ color: C.slate }}>
                  {f.label}
                </div>
                <NumInput
                  value={cur[f.key]}
                  onChange={(v) => saveField(f.key, v)}
                  placeholder="—"
                  disabled={closed || Boolean(cur.submitted_at)}
                  kind={f.kind}
                  hint
                />
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            {num(cur.ape) > 0 && num(cur.frp) > num(cur.ape) && (
              <div className="mb-3 flex items-start gap-2 text-xs" style={{ color: C.amber }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                FRP is higher than APE. That&apos;s unusual — worth double-checking before you submit.
              </div>
            )}
            {!cur.submitted_at && !closed && (
              <PrimaryButton
                onClick={() => void submitMonth()}
                icon={Send}
                tone="green"
                disabled={!num(cur.ape) && !num(cur.frp) && !num(cur.policies)}
              >
                Submit to my team lead
              </PrimaryButton>
            )}
          </div>
        </div>

        <div className="desk-card p-4">
          <div className="mb-1 text-sm font-semibold" style={{ color: C.ink }}>
            Your certification scores
          </div>
          <div className="mb-4 text-xs" style={{ color: C.slate }}>
            Out of 100. These carry across months — update them whenever you re-certify.
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CERT_FIELDS.map((c) => (
              <div key={c.key}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded-sm" style={{ width: 3, height: 13, background: c.color }} />
                  <span className="text-xs" style={{ color: C.slate }}>
                    {c.label}
                  </span>
                </div>
                <NumInput value={certs[c.key]} onChange={(v) => saveCert(c.key, v)} placeholder="—" kind="count" />
              </div>
            ))}
          </div>
        </div>

        {weakCerts.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: C.amberBg, color: C.ink }}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div className="text-xs">
              {weakCerts.map((c) => c.label).join(" and ")} {weakCerts.length === 1 ? "is" : "are"} below 70. Update
              after you re-sit so your team lead isn&apos;t working off a stale score.
            </div>
          </div>
        )}

        {chartData.some((d) => d.APE > 0) && (
          <div className="desk-card p-4">
            <div className="mb-3 text-sm font-semibold" style={{ color: C.ink }}>
              Your months so far, in ₹ lakh
            </div>
            <ApeChart data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
}
