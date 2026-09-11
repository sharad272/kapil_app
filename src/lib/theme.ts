export const C = {
  navy: "var(--navy)",
  navyDeep: "var(--navy-deep)",
  navyMid: "var(--navy-mid)",
  gold: "var(--gold)",
  paper: "var(--paper)",
  panel: "var(--panel)",
  line: "var(--line)",
  lineSoft: "var(--line-soft)",
  ink: "var(--ink)",
  heading: "var(--heading)",
  slate: "var(--slate)",
  slateLight: "var(--slate-light)",
  green: "var(--green)",
  greenBg: "var(--green-bg)",
  greenLine: "var(--green-line)",
  red: "var(--red)",
  redBg: "var(--red-bg)",
  redLine: "var(--red-line)",
  amber: "var(--amber)",
  amberBg: "var(--amber-bg)",
  amberLine: "var(--amber-line)",
  ice: "var(--ice)",
  teal: "var(--teal)",
  onNavy: "var(--on-navy)",
  chart: "var(--chart)",
};

export function hasSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("YOUR-PROJECT"));
}

export const DEMO_COOKIE = "rm_demo";
