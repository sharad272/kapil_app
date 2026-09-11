import { createClient } from "@/lib/supabase/server";
import type { DeskNotice, NoticePriority, Session } from "@/lib/types";

type Store = { notices: DeskNotice[] };

const g = globalThis as typeof globalThis & { __deskNotices?: Store };

function memory(): Store {
  if (!g.__deskNotices) g.__deskNotices = { notices: [] };
  return g.__deskNotices;
}

function mapRow(row: Record<string, unknown>): DeskNotice {
  return {
    id: String(row.id),
    rm_id: String(row.rm_id),
    rm_name: String(row.rm_name ?? ""),
    from_id: String(row.from_id),
    from_name: String(row.from_name ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    query: String(row.query ?? ""),
    reason: String(row.reason ?? ""),
    priority: row.priority === "high" ? "high" : "normal",
    month_id: String(row.month_id ?? ""),
    created_at: String(row.created_at ?? new Date().toISOString()),
    read_at: row.read_at ? String(row.read_at) : null,
    ack_at: row.ack_at ? String(row.ack_at) : null,
  };
}

function sortNotices(rows: DeskNotice[]) {
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listMemory(rmId?: string) {
  const rows = memory().notices;
  return sortNotices(rmId ? rows.filter((n) => n.rm_id === rmId) : rows);
}

export function createMemory(input: {
  rmIds: { id: string; name: string }[];
  from_id: string;
  from_name: string;
  title: string;
  body: string;
  query: string;
  reasons: Record<string, string>;
  messages: Record<string, string>;
  priority: NoticePriority;
  month_id: string;
}) {
  const created: DeskNotice[] = input.rmIds.map((rm) => ({
    id: crypto.randomUUID(),
    rm_id: rm.id,
    rm_name: rm.name,
    from_id: input.from_id,
    from_name: input.from_name,
    title: input.title,
    body: input.messages[rm.id] || input.body,
    query: input.query,
    reason: input.reasons[rm.id] ?? "",
    priority: input.priority,
    month_id: input.month_id,
    created_at: new Date().toISOString(),
    read_at: null,
    ack_at: null,
  }));
  memory().notices.unshift(...created);
  return created;
}

export function markMemory(id: string, field: "read_at" | "ack_at", rmId: string) {
  const row = memory().notices.find((n) => n.id === id && n.rm_id === rmId);
  if (!row) return null;
  row[field] = new Date().toISOString();
  if (field === "ack_at" && !row.read_at) row.read_at = row.ack_at;
  return row;
}

export async function listNotices(session: Session) {
  const own = session.profile.role !== "tl";
  if (session.mode === "demo") return own ? listMemory(session.profile.id) : listMemory();

  try {
    const supabase = await createClient();
    let q = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (own) q = q.eq("rm_id", session.profile.id);
    const { data, error } = await q;
    if (error) return own ? listMemory(session.profile.id) : listMemory();
    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  } catch {
    return own ? listMemory(session.profile.id) : listMemory();
  }
}

export async function sendNotices(
  session: Session,
  input: {
    rmIds: { id: string; name: string }[];
    title: string;
    body: string;
    query: string;
    reasons: Record<string, string>;
    messages: Record<string, string>;
    priority: NoticePriority;
    month_id: string;
  },
) {
  const payload = {
    ...input,
    from_id: session.profile.id,
    from_name: session.profile.full_name,
  };
  const created = createMemory(payload);
  if (session.mode === "demo") return created;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("notifications").insert(created).select("*");
    if (error || !data) return created;
    return (data as Record<string, unknown>[]).map(mapRow);
  } catch {
    return created;
  }
}

export async function markNotice(session: Session, id: string, field: "read_at" | "ack_at") {
  const rmId = session.profile.id;
  const mem = markMemory(id, field, rmId);
  if (session.mode === "demo") return mem;

  try {
    const supabase = await createClient();
    const patch: Record<string, string> = { [field]: new Date().toISOString() };
    if (field === "ack_at") patch.read_at = patch.ack_at ?? new Date().toISOString();
    const { data, error } = await supabase
      .from("notifications")
      .update(patch)
      .eq("id", id)
      .eq("rm_id", rmId)
      .select("*")
      .maybeSingle();
    if (error || !data) return mem;
    return mapRow(data as Record<string, unknown>);
  } catch {
    return mem;
  }
}
