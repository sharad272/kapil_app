import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/lib/theme";
import { DEMO_RMS, DEMO_TL } from "@/lib/demo-data";

export async function POST(request: Request) {
  let role: "tl" | "rm" = "rm";
  try {
    const body = (await request.json()) as { role?: string };
    if (body.role === "tl") role = "tl";
  } catch {
    role = "rm";
  }

  const id = role === "tl" ? DEMO_TL.id : DEMO_RMS[0].id;
  const response = NextResponse.json({ ok: true, role, id });
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
  response.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
