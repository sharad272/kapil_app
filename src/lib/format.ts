export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function parseLoose(raw: string | number | null | undefined, units = true): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const cleaned = String(raw).trim().replace(/₹/g, "").replace(/,/g, "").replace(/\s+/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const m = units
    ? cleaned.match(/^(-?\d*\.?\d+)(k|l|lac|lakh|cr|crore)?$/i)
    : cleaned.match(/^(-?\d*\.?\d+)$/);
  if (!m) return null;
  let n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  if (units) {
    const u = (m[2] || "").toLowerCase();
    if (u === "k") n *= 1_000;
    else if (u === "l" || u === "lac" || u === "lakh") n *= 100_000;
    else if (u === "cr" || u === "crore") n *= 10_000_000;
  }
  return n;
}

/** Indian grouping as digits are typed: 123 → 1,23,456 → 12,34,567. */
export function formatInrTyping(raw: string, units = true): string {
  const parsed = parseLoose(raw, units);
  if (parsed === null) {
    const digits = raw.replace(/[₹,\s]/g, "");
    if (digits === "" || digits === "-") return digits;
    return units ? raw : digits.replace(/[^\d.-]/g, "");
  }
  const fraction = !Number.isInteger(parsed);
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: fraction ? 2 : 0,
  }).format(parsed);
}

export function formatInrDisplay(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "number" ? value : parseLoose(value);
  if (n === null) return String(value);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
}

/** Scale name by digit length: hundred, thousand, lakh, ten lakh, crore… */
export function inrDigitScale(n: number): string {
  const digits = String(Math.floor(Math.abs(n))).replace(/^0+/, "").length || 1;
  if (digits <= 2) return "";
  if (digits === 3) return "hundred";
  if (digits === 4) return "thousand";
  if (digits === 5) return "ten thousand";
  if (digits === 6) return "lakh";
  if (digits === 7) return "ten lakh";
  if (digits === 8) return "crore";
  if (digits === 9) return "ten crore";
  if (digits === 10) return "hundred crore";
  return "thousand crore";
}

export function inrInputHint(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : parseLoose(value);
  if (n === null) return "";
  const scale = inrDigitScale(n);
  const spoken = Math.abs(n) >= 10_000_000 ? fmtCr(n) : Math.abs(n) >= 100_000 ? fmtLakh(n) : "";
  return [scale, spoken && spoken !== "—" ? spoken : ""].filter(Boolean).join(" · ");
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
