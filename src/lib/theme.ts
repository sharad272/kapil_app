export const C = {
  navy: "#1E2761",
  navyDeep: "#141A45",
  navyMid: "#2A3470",
  gold: "#C9A24B",
  paper: "#F7F8FC",
  panel: "#FFFFFF",
  line: "#E2E6F2",
  lineSoft: "#EEF1F8",
  ink: "#1B1F3B",
  slate: "#5B6484",
  slateLight: "#8B93AE",
  green: "#2E8B57",
  greenBg: "#EAF5EF",
  red: "#C0392B",
  redBg: "#FDEDEA",
  amber: "#C9822F",
  amberBg: "#FDF3E6",
  ice: "#CADCFC",
  teal: "#50808E",
};

export function hasSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("YOUR-PROJECT"));
}

export const DEMO_COOKIE = "rm_demo";
