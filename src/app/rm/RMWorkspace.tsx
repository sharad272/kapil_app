"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Clock, Send } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C, EmptyState, NumInput, PrimaryButton, StatTile, TopBar } from "@/components/ui";
import { achievementColor, fmtLakh, num, parseLoose, whenText } from "@/lib/format";
import { hasSupabase } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import type { AppMode, Assignment, Certification, MonthRow, Profile, Submission } from "@/lib/types";

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
  const [activeMonth, setActiveMonth] = useState(months.length ? months[months.length - 1].id : "");
  const [status, setStatus] = useState("");

  const assignMap = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments.forEach((a) => {
      map[a.month_id] = a;
    });
    return map;
  }, [assignments]);

  async function signOut() {
    await fetch("/api/demo/session", { method: "DELETE" });
    if (mode === "live" && hasSupabase()) {
      await createClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  function later(id: string, work: () => Promise<void>) {
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      void work();
    }, 450);
  }

  async function persistSubmission(next: Submission) {
    if (mode === "demo") return;
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

  if (months.length === 0) {
    return (
      <div>
        <TopBar
          title={`Hello, ${profile.full_name.split(" ")[0]}`}
          subtitle="Submit your monthly figures"
          onSignOut={signOut}
        />
        <div className="mx-auto max-w-4xl p-5">
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
  const closed = months.find((m) => m.id === activeMonth)?.is_open === false;

  function saveField(field: "ape" | "frp" | "policies", raw: string) {
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

  async function setSubmitted(on: boolean) {
    const stamp = on ? new Date().toISOString() : null;
    const next = { ...cur, submitted_at: stamp };
    setSubs((s) => ({ ...s, [activeMonth]: next }));
    await persistSubmission(next);
    setStatus(on ? "Submitted" : "Reopened");
    startTransition(() => router.refresh());
  }

  const chartData = months.map((m) => {
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
    <div className="min-h-screen">
      <TopBar
        title={`Hello, ${profile.full_name.split(" ")[0]}`}
        subtitle="Submit your monthly figures and keep your certification scores current"
        status={status}
        onSignOut={signOut}
        right={
          <select
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white outline-none"
            style={{ background: C.navyDeep, border: `1px solid ${C.navyMid}` }}
          >
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.is_open ? "" : " · closed"}
              </option>
            ))}
          </select>
        }
      />

      <div className="mx-auto max-w-4xl space-y-4 p-5">
        {mode === "demo" && (
          <div className="rounded-lg px-4 py-3 text-xs" style={{ background: C.amberBg, color: C.ink }}>
            Preview as Aarav Sharma. Writes stay on this device until Supabase is connected.
          </div>
        )}
        {closed && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.slate }}>
            This month is closed. You can still read your figures; new writes are blocked.
          </div>
        )}
        {cur.submitted_at && (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: C.greenBg, border: "1px solid #BEDECB" }}>
            <Check size={16} style={{ color: C.green }} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: C.green }}>
                Submitted
              </div>
              <div className="mt-0.5 text-xs" style={{ color: C.ink }}>
                Sent to your team lead on {whenText(cur.submitted_at)}. You can reopen it if something needs correcting.
              </div>
            </div>
            {!closed && (
              <button onClick={() => setSubmitted(false)} className="shrink-0 text-xs font-medium underline" style={{ color: C.green }}>
                Reopen
              </button>
            )}
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
          <StatTile label="Quality score" value={quality === null ? "—" : quality} sub="assigned by your team lead" />
        </div>

        <div className="overflow-hidden rounded-lg" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
            <div className="text-sm font-semibold" style={{ color: C.ink }}>
              Your figures
            </div>
            <div className="mt-0.5 text-xs" style={{ color: C.slate }}>
              Enter APE and FRP in rupees. Target and quality score are set by your team lead. Saves are coalesced every 450ms so a typing burst is one write.
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
            {(
              [
                { key: "ape" as const, label: "Annualised premium equivalent (₹)" },
                { key: "frp" as const, label: "First-year rated premium (₹)" },
                { key: "policies" as const, label: "Policies issued" },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <div className="mb-1.5 text-xs" style={{ color: C.slate }}>
                  {f.label}
                </div>
                <NumInput value={cur[f.key]} onChange={(v) => saveField(f.key, v)} placeholder="—" disabled={closed} />
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
                onClick={() => setSubmitted(true)}
                icon={Send}
                tone="green"
                disabled={!num(cur.ape) && !num(cur.frp) && !num(cur.policies)}
              >
                Submit to my team lead
              </PrimaryButton>
            )}
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
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
                <NumInput value={certs[c.key]} onChange={(v) => saveCert(c.key, v)} placeholder="—" />
              </div>
            ))}
          </div>
        </div>

        {chartData.some((d) => d.APE > 0) && (
          <div className="rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="mb-3 text-sm font-semibold" style={{ color: C.ink }}>
              Your months so far, in ₹ lakh
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lineSoft} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Target" fill={C.lineSoft} radius={[3, 3, 0, 0]} />
                <Bar dataKey="APE" fill={C.navy} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
