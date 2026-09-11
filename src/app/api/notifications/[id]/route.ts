import { NextResponse } from "next/server";
import { markNotice } from "@/lib/notifications";
import { getSession } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.profile.role === "tl") {
    return NextResponse.json({ error: "Only the RM can acknowledge a notice" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { action?: string };
  const field = body.action === "ack" ? "ack_at" : "read_at";
  const row = await markNotice(session, id, field);
  if (!row) return NextResponse.json({ error: "Notice not found" }, { status: 404 });
  return NextResponse.json({ notice: row });
}
