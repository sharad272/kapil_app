import { NextResponse } from "next/server";
import { loadTL } from "@/lib/load";
import { listNotices, sendNotices } from "@/lib/notifications";
import { getSession } from "@/lib/session";
import type { NoticePriority } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const notices = await listNotices(session);
  const unread = notices.filter((n) => n.rm_id === session.profile.id && !n.read_at).length;
  return NextResponse.json({ notices, unread });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.profile.role !== "tl") {
    return NextResponse.json({ error: "Team lead only" }, { status: 403 });
  }

  const body = (await request.json()) as {
    rmIds?: string[];
    title?: string;
    body?: string;
    query?: string;
    reasons?: Record<string, string>;
    messages?: Record<string, string>;
    priority?: NoticePriority;
    monthId?: string;
  };

  const ids = [...new Set((body.rmIds ?? []).filter(Boolean))];
  if (!ids.length) return NextResponse.json({ error: "Pick at least one RM" }, { status: 400 });

  const payload = await loadTL(session);
  const allowed = new Map(payload.team.map((rm) => [rm.id, rm]));
  const rmIds = ids
    .map((id) => allowed.get(id))
    .filter((rm): rm is NonNullable<typeof rm> => Boolean(rm))
    .map((rm) => ({ id: rm.id, name: rm.full_name }));

  if (!rmIds.length) return NextResponse.json({ error: "Those RMs are not on your team" }, { status: 400 });

  const title = body.title?.trim() || `Check-in from ${session.profile.full_name.split(" ")[0]}`;
  const text = body.body?.trim() || "Please review your figures for this month.";
  const created = await sendNotices(session, {
    rmIds,
    title,
    body: text,
    query: body.query?.trim() || "",
    reasons: body.reasons ?? {},
    messages: body.messages ?? {},
    priority: body.priority === "high" ? "high" : "normal",
    month_id: body.monthId || payload.months.at(-1)?.id || "",
  });

  return NextResponse.json({ notices: created });
}
