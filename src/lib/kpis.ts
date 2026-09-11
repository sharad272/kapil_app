import { num, pctChange } from "./format";
import type {
  Assignment,
  Certification,
  MonthRow,
  Profile,
  RmKpi,
  Submission,
} from "./types";

const key = (rm: string, month: string) => `${rm}|${month}`;

export function buildKpis({
  team,
  months,
  submissions,
  assignments,
  certs,
  monthId,
}: {
  team: Profile[];
  months: MonthRow[];
  submissions: Submission[];
  assignments: Assignment[];
  certs: Certification[];
  monthId: string;
}): RmKpi[] {
  const month = months.find((m) => m.id === monthId);
  const monthIdx = months.findIndex((m) => m.id === monthId);
  const prev = monthIdx > 0 ? months[monthIdx - 1] : null;
  const label = month?.label ?? monthId;

  const subMap = new Map(submissions.map((s) => [key(s.rm_id, s.month_id), s]));
  const asgMap = new Map(assignments.map((a) => [key(a.rm_id, a.month_id), a]));
  const certMap = new Map(certs.map((c) => [c.rm_id, c]));

  return team.map((rm) => {
    const s = subMap.get(key(rm.id, monthId));
    const a = asgMap.get(key(rm.id, monthId));
    const p = prev ? subMap.get(key(rm.id, prev.id)) : undefined;
    const c = certMap.get(rm.id);
    const ape = num(s?.ape);
    const target = num(a?.target);
    const certVals = [c?.ulip, c?.endowment, c?.term].filter((v) => v !== null && v !== undefined) as number[];
    const certAvg = certVals.length ? certVals.reduce((x, y) => x + y, 0) / certVals.length : null;
    const achievementPct = target ? (ape / target) * 100 : null;
    const flags: string[] = [];
    if (!s?.submitted_at) flags.push("pending_submission");
    if (achievementPct !== null && achievementPct < 80) flags.push("below_80_achievement");
    if (achievementPct !== null && achievementPct < 100) flags.push("behind_target");
    if (a?.quality_score !== null && a?.quality_score !== undefined && a.quality_score < 80) {
      flags.push("quality_watch");
    }
    if (certAvg !== null && certAvg < 70) flags.push("weak_certification");
    if (c?.ulip !== null && c?.ulip !== undefined && c.ulip < 70) flags.push("weak_ulip");
    if (ape && num(s?.frp) / ape < 0.85) flags.push("frp_lag");
    const mom = p ? pctChange(ape, num(p.ape)) : null;
    if (mom !== null && mom < 0) flags.push("mom_down");

    return {
      id: rm.id,
      name: rm.full_name,
      email: rm.email,
      month: label,
      ape,
      frp: num(s?.frp),
      policies: num(s?.policies),
      target,
      achievementPct,
      quality: a?.quality_score ?? null,
      momPct: mom,
      submitted: Boolean(s?.submitted_at),
      ulip: c?.ulip ?? null,
      endowment: c?.endowment ?? null,
      term: c?.term ?? null,
      certAvg,
      flags,
    };
  });
}

export function riskLabel(flag: string) {
  switch (flag) {
    case "pending_submission":
      return "Not submitted";
    case "below_80_achievement":
      return "APE < 80%";
    case "behind_target":
      return "Behind target";
    case "quality_watch":
      return "Quality watch";
    case "weak_certification":
      return "Cert avg < 70";
    case "weak_ulip":
      return "ULIP < 70";
    case "frp_lag":
      return "FRP lag";
    case "mom_down":
      return "MoM down";
    default:
      return flag;
  }
}
