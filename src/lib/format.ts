export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function parseLoose(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/[₹,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function fmtLakh(v: number | null | undefined, dp = 1): string {
  if (!v) return "—";
  return `₹${(v / 100000).toFixed(dp)}L`;
}

export function fmtCr(v: number | null | undefined): string {
  if (!v) return "₹0.00 Cr";
  return `₹${(v / 10000000).toFixed(2)} Cr`;
}

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("en-IN").format(Math.round(v));
}

export function pctChange(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function achievementColor(a: number | null): string {
  if (a === null) return "var(--slate-light)";
  if (a >= 100) return "var(--green)";
  if (a >= 80) return "var(--amber)";
  return "var(--red)";
}

export function whenText(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
      " at " +
      d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    );
  } catch {
    return "";
  }
}

export function monthMeta(year: number, monthIndex0: number) {
  const NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mm = String(monthIndex0 + 1).padStart(2, "0");
  return {
    id: `${year}-${mm}`,
    label: `${NAMES[monthIndex0]}'${String(year).slice(2)}`,
    sort_order: year * 100 + (monthIndex0 + 1),
  };
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  return wrapped;
}
