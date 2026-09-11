import { NextResponse } from "next/server";
import { addRm, listTeam, removeRm } from "@/lib/roster";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

function cleanName(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

function cleanEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.profile.role !== "tl") return NextResponse.json({ error: "Team lead only" }, { status: 403 });
  if (session.mode === "demo") return NextResponse.json({ team: listTeam() });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,active")
    .eq("role", "rm")
    .eq("active", true)
    .order("full_name");
  if (error) return NextResponse.json({ team: [] });
  return NextResponse.json({ team: (data ?? []) as Profile[] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.profile.role !== "tl") return NextResponse.json({ error: "Team lead only" }, { status: 403 });

  const body = (await request.json()) as { full_name?: string; email?: string };
  const full_name = cleanName(body.full_name ?? "");
  const email = cleanEmail(body.email ?? "");
  if (full_name.length < 2) return NextResponse.json({ error: "Enter the RM’s name" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a work email" }, { status: 400 });
  }

  if (session.mode === "demo") {
    return NextResponse.json({ rm: addRm({ full_name, email }) });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("profiles").select("id,email,full_name,role,active").eq("email", email).maybeSingle();
  if (existing) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ active: true, full_name, role: "rm" })
      .eq("id", existing.id)
      .select("id,email,full_name,role,active")
      .single();
    if (error) return NextResponse.json({ error: "Could not restore that RM" }, { status: 400 });
    return NextResponse.json({ rm: data as Profile });
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ email, full_name, role: "rm", active: true })
    .select("id,email,full_name,role,active")
    .single();
  if (error) {
    return NextResponse.json(
      { error: "Could not add that RM. If Postgres still requires an auth user, drop profiles_id_fkey (see schema.sql)." },
      { status: 400 },
    );
  }
  return NextResponse.json({ rm: data as Profile });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.profile.role !== "tl") return NextResponse.json({ error: "Team lead only" }, { status: 403 });

  const body = (await request.json()) as { id?: string };
  const id = body.id?.trim() ?? "";
  if (!id) return NextResponse.json({ error: "Missing RM" }, { status: 400 });

  if (session.mode === "demo") {
    const rm = removeRm(id);
    if (!rm) return NextResponse.json({ error: "RM not on the book" }, { status: 404 });
    return NextResponse.json({ ok: true, id });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ active: false }).eq("id", id).eq("role", "rm");
  if (error) return NextResponse.json({ error: "Could not remove that RM" }, { status: 400 });
  return NextResponse.json({ ok: true, id });
}
