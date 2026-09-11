import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/lib/theme";
import { DEMO_TL } from "@/lib/demo-data";
import { findRm, listTeam } from "@/lib/roster";

export async function POST(request: Request) {
  let id = DEMO_TL.id;
  try {
    const body = (await request.json()) as { role?: string; id?: string };
    if (body.id === DEMO_TL.id || body.id === "tl" || body.role === "tl") {
      id = DEMO_TL.id;
    } else if (body.id && findRm(body.id)) {
      id = body.id;
    } else {
      const first = listTeam()[0];
      if (!first) {
        return NextResponse.json({ error: "No relationship managers on the book" }, { status: 400 });
      }
      id = first.id;
    }
  } catch {
    const first = listTeam()[0];
    id = first?.id ?? DEMO_TL.id;
  }

  const profile = id === DEMO_TL.id ? DEMO_TL : findRm(id);
  const response = NextResponse.json({ ok: true, role: profile?.role ?? "rm", id });
  response.cookies.set(DEMO_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_COOKIE, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
