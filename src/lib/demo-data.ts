import type {
  Assignment,
  Certification,
  CoachingNote,
  MonthRow,
  Profile,
  Submission,
} from "./types";

export const DEMO_TL: Profile = {
  id: "demo-tl",
  email: "kapil.sharma@atlaslife.in",
  full_name: "Kapil Sharma",
  role: "tl",
  active: true,
};

export const DEMO_RMS: Profile[] = [
  { id: "demo-aarav", email: "aarav.sharma@atlaslife.in", full_name: "Aarav Sharma", role: "rm", active: true },
  { id: "demo-diya", email: "diya.mehta@atlaslife.in", full_name: "Diya Mehta", role: "rm", active: true },
  { id: "demo-rohan", email: "rohan.iyer@atlaslife.in", full_name: "Rohan Iyer", role: "rm", active: true },
  { id: "demo-ishita", email: "ishita.nair@atlaslife.in", full_name: "Ishita Nair", role: "rm", active: true },
  { id: "demo-kabir", email: "kabir.sen@atlaslife.in", full_name: "Kabir Sen", role: "rm", active: true },
  { id: "demo-ananya", email: "ananya.rao@atlaslife.in", full_name: "Ananya Rao", role: "rm", active: true },
];

export const DEMO_MONTHS: MonthRow[] = [
  { id: "2026-07", label: "Jul'26", sort_order: 202607, is_open: false },
  { id: "2026-08", label: "Aug'26", sort_order: 202608, is_open: false },
  { id: "2026-09", label: "Sep'26", sort_order: 202609, is_open: true },
];

const TARGET = 600000;

export const DEMO_ASSIGNMENTS: Assignment[] = DEMO_RMS.flatMap((rm) =>
  DEMO_MONTHS.map((month, i) => ({
    rm_id: rm.id,
    month_id: month.id,
    target: TARGET,
    quality_score: [88, 81, 74, 91, 79, 86][DEMO_RMS.indexOf(rm)] - i,
  })),
);

const ape = {
  "demo-aarav": [520000, 610000, 680000],
  "demo-diya": [480000, 510000, 540000],
  "demo-rohan": [390000, 405000, 410000],
  "demo-ishita": [640000, 690000, 720000],
  "demo-kabir": [310000, 360000, 390000],
  "demo-ananya": [450000, 490000, 510000],
} as const;

export const DEMO_SUBMISSIONS: Submission[] = DEMO_RMS.flatMap((rm) =>
  DEMO_MONTHS.map((month, i) => {
    const value = ape[rm.id as keyof typeof ape][i];
    const closed = !month.is_open;
    return {
      rm_id: rm.id,
      month_id: month.id,
      ape: value,
      frp: Math.round(value * (rm.id === "demo-kabir" && month.id === "2026-09" ? 0.78 : 0.92)),
      policies: 8 + i + DEMO_RMS.indexOf(rm),
      submitted_at: closed || rm.id !== "demo-kabir" ? "2026-09-08T11:20:00.000Z" : null,
    };
  }),
);

export const DEMO_CERTS: Certification[] = [
  { rm_id: "demo-aarav", ulip: 84, endowment: 78, term: 91 },
  { rm_id: "demo-diya", ulip: 76, endowment: 88, term: 72 },
  { rm_id: "demo-rohan", ulip: 68, endowment: 71, term: 80 },
  { rm_id: "demo-ishita", ulip: 92, endowment: 85, term: 88 },
  { rm_id: "demo-kabir", ulip: 61, endowment: 66, term: 70 },
  { rm_id: "demo-ananya", ulip: 81, endowment: 74, term: 77 },
];

export const DEMO_NOTES: CoachingNote[] = [
  { rm_id: "demo-rohan", note: "Strong on term; ULIP pipeline thin. Pair with Ishita on the bank-assurance book this fortnight." },
  { rm_id: "demo-kabir", note: "September still open — follow up before the 12th. Quality dip is persistency, not sourcing." },
];

export function demoProfile(token: string): Profile | null {
  if (token === DEMO_TL.id || token === "tl") return DEMO_TL;
  return DEMO_RMS.find((rm) => rm.id === token) ?? null;
}
