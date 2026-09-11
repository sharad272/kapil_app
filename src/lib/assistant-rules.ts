import { riskLabel } from "@/lib/kpis";
import type { AssistantMatch, RmKpi } from "@/lib/types";

function cutAfter(q: string, words: RegExp, fallback: number) {
  const m = words.exec(q);
  if (!m) return fallback;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : fallback;
}

export function rulesFilter(query: string, roster: RmKpi[]): AssistantMatch[] {
  const q = query.toLowerCase();
  const filtered = roster.filter((rm) => {
    if (/not submit|pending|haven.?t submit|missing submit|still open/.test(q)) return !rm.submitted;
    if (/cert|ulip|endowment|term/.test(q)) {
      const n = cutAfter(q, /below\s+(\d+)/, 70);
      if (/ulip/.test(q)) return (rm.ulip ?? 100) < n;
      if (/endowment/.test(q)) return (rm.endowment ?? 100) < n;
      if (/\bterm\b/.test(q)) return (rm.term ?? 100) < n;
      return (rm.certAvg ?? 100) < n;
    }
    if (/quality/.test(q)) return (rm.quality ?? 100) < 80;
    if (/frp/.test(q)) return rm.flags.includes("frp_lag");
    if (/mom|month.on.month|declin/.test(q)) return (rm.momPct ?? 0) < 0;
    if (/top|best|over.?achiev|hit target/.test(q)) return (rm.achievementPct ?? 0) >= 100;
    if (/risk|call today|nudge|watch list|should call/.test(q)) return rm.flags.length > 0;
    if (/behind|shortfall|under.?target|below/.test(q)) {
      const n = cutAfter(q, /(?:below|under)\s+(\d+)/, 80);
      return rm.achievementPct !== null && rm.achievementPct < n;
    }
    const named = roster.find((r) => q.includes(r.name.split(" ")[0].toLowerCase()) && q.includes(r.name.split(" ").slice(-1)[0].toLowerCase()));
    if (named) return rm.id === named.id;
    return rm.flags.length > 0;
  });

  const ranked = [...filtered].sort((a, b) => b.flags.length - a.flags.length || a.name.localeCompare(b.name));
  return ranked.map((rm) => ({
    id: rm.id,
    name: rm.name,
    email: rm.email,
    reason: rm.flags.map(riskLabel).join(" · ") || "Matched the request",
    message: defaultNudge(rm),
    kpis: rm,
  }));
}

export function defaultNudge(rm: RmKpi) {
  const first = rm.name.split(" ")[0];
  if (!rm.submitted) {
    return `${first}, ${rm.month} is still open on my desk — please submit APE, FRP and policies when you can.`;
  }
  if (rm.achievementPct !== null && rm.achievementPct < 80) {
    return `${first}, you are at ${rm.achievementPct.toFixed(0)}% of target for ${rm.month}. Let’s close the gap this fortnight.`;
  }
  if (rm.quality !== null && rm.quality < 80) {
    return `${first}, quality is sitting at ${rm.quality}. I’ll walk through the persistency cases with you.`;
  }
  if ((rm.certAvg ?? 100) < 70) {
    return `${first}, certification average is ${rm.certAvg?.toFixed(0)}. Please re-sit the weak paper this week.`;
  }
  return `${first} — please review your ${rm.month} figures and ping me if anything looks off.`;
}

export function huddleBrief(kpis: RmKpi[], monthLabel: string) {
  if (!kpis.length) return "No relationship managers on the book yet.";
  const pending = kpis.filter((k) => !k.submitted).map((k) => k.name.split(" ")[0]);
  const behind = kpis.filter((k) => k.achievementPct !== null && k.achievementPct < 80);
  const quality = kpis.filter((k) => k.quality !== null && k.quality < 80);
  const certs = kpis.filter((k) => k.certAvg !== null && k.certAvg < 70);
  const teamApe = kpis.reduce((s, k) => s + k.ape, 0);
  const teamTarget = kpis.reduce((s, k) => s + k.target, 0);
  const ach = teamTarget ? Math.round((teamApe / teamTarget) * 100) : null;
  const parts = [
    `${monthLabel}: team is ${ach === null ? "waiting on targets" : `${ach}% of target`}.`,
  ];
  if (pending.length) parts.push(`Still open: ${pending.join(", ")}.`);
  else parts.push("Everyone has submitted.");
  if (behind.length) parts.push(`Below 80% APE: ${behind.map((k) => k.name.split(" ")[0]).join(", ")}.`);
  if (quality.length) parts.push(`Quality watch: ${quality.map((k) => k.name.split(" ")[0]).join(", ")}.`);
  if (certs.length) parts.push(`Certifications under 70: ${certs.map((k) => k.name.split(" ")[0]).join(", ")}.`);
  return parts.join(" ");
}
