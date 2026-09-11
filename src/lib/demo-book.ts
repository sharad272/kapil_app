import {
  DEMO_ASSIGNMENTS,
  DEMO_CERTS,
  DEMO_MONTHS,
  DEMO_NOTES,
  DEMO_RMS,
  DEMO_SUBMISSIONS,
} from "@/lib/demo-data";
import type { Assignment, Certification, CoachingNote, MonthRow, Profile, Submission } from "@/lib/types";

export const DEMO_BOOK_KEY = "tv-desk-book";

export type DemoBook = {
  v: 1;
  team: Profile[];
  months: MonthRow[];
  submissions: Submission[];
  assignments: Assignment[];
  certs: Certification[];
  notes: CoachingNote[];
};

export function seedDemoBook(): DemoBook {
  return {
    v: 1,
    team: DEMO_RMS.map((rm) => ({ ...rm })),
    months: DEMO_MONTHS.map((m) => ({ ...m })),
    submissions: DEMO_SUBMISSIONS.map((s) => ({ ...s })),
    assignments: DEMO_ASSIGNMENTS.map((a) => ({ ...a })),
    certs: DEMO_CERTS.map((c) => ({ ...c })),
    notes: DEMO_NOTES.map((n) => ({ ...n })),
  };
}

export function readDemoBook(): DemoBook | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_BOOK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoBook;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.submissions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDemoBook(book: DemoBook) {
  if (typeof window === "undefined") return true;
  try {
    // Typical book is ~20–80 KB. Browsers allow ~5 MB per origin.
    window.localStorage.setItem(DEMO_BOOK_KEY, JSON.stringify(book));
    return true;
  } catch {
    return false;
  }
}

export function loadDemoBook(): DemoBook {
  const existing = readDemoBook();
  if (existing) return existing;
  const seed = seedDemoBook();
  writeDemoBook(seed);
  return seed;
}

export function activeRms(book: DemoBook): Profile[] {
  return book.team.filter((rm) => rm.role === "rm" && rm.active);
}
