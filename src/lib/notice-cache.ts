import type { DeskNotice } from "@/lib/types";

const KEY = "rm_desk_notices";

export function readLocalNotices(): DeskNotice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeskNotice[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalNotices(rows: DeskNotice[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 200)));
  } catch {
    /* quota */
  }
}

export function mergeNotices(...groups: DeskNotice[][]) {
  const map = new Map<string, DeskNotice>();
  groups.flat().forEach((row) => {
    const prev = map.get(row.id);
    if (!prev) {
      map.set(row.id, row);
      return;
    }
    map.set(row.id, {
      ...prev,
      ...row,
      read_at: row.read_at || prev.read_at,
      ack_at: row.ack_at || prev.ack_at,
    });
  });
  return [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function upsertLocalNotices(rows: DeskNotice[]) {
  writeLocalNotices(mergeNotices(readLocalNotices(), rows));
}
