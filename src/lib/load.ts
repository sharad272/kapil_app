import {
  DEMO_ASSIGNMENTS,
  DEMO_CERTS,
  DEMO_MONTHS,
  DEMO_NOTES,
  DEMO_RMS,
  DEMO_SUBMISSIONS,
} from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { Assignment, Certification, CoachingNote, MonthRow, Profile, RMPayload, Session, Submission, TLPayload } from "@/lib/types";

export async function loadRM(session: Session): Promise<RMPayload> {
  if (session.mode === "demo") {
    const id = session.profile.id;
    return {
      profile: session.profile,
      months: DEMO_MONTHS,
      submissions: DEMO_SUBMISSIONS.filter((row) => row.rm_id === id),
      assignments: DEMO_ASSIGNMENTS.filter((row) => row.rm_id === id),
      certs: DEMO_CERTS.find((row) => row.rm_id === id) ?? null,
      mode: "demo",
    };
  }

  const supabase = await createClient();
  const id = session.profile.id;
  const [{ data: months }, { data: submissions }, { data: assignments }, { data: certs }] =
    await Promise.all([
      supabase.from("months").select("id,label,sort_order,is_open").order("sort_order"),
      supabase.from("submissions").select("rm_id,month_id,ape,frp,policies,submitted_at").eq("rm_id", id),
      supabase.from("assignments").select("rm_id,month_id,target,quality_score").eq("rm_id", id),
      supabase.from("certifications").select("rm_id,ulip,endowment,term").eq("rm_id", id).maybeSingle(),
    ]);

  return {
    profile: session.profile,
    months: (months ?? []) as MonthRow[],
    submissions: (submissions ?? []) as Submission[],
    assignments: (assignments ?? []) as Assignment[],
    certs: (certs ?? null) as Certification | null,
    mode: "live",
  };
}

export async function loadTL(session: Session): Promise<TLPayload> {
  if (session.mode === "demo") {
    return {
      profile: session.profile,
      team: DEMO_RMS,
      months: DEMO_MONTHS,
      submissions: DEMO_SUBMISSIONS,
      assignments: DEMO_ASSIGNMENTS,
      certs: DEMO_CERTS,
      notes: DEMO_NOTES,
      mode: "demo",
    };
  }

  const supabase = await createClient();
  const [{ data: team }, { data: months }, { data: submissions }, { data: assignments }, { data: certs }, { data: notes }] =
    await Promise.all([
      supabase.from("profiles").select("id,email,full_name,role,active").eq("role", "rm").eq("active", true).order("full_name"),
      supabase.from("months").select("id,label,sort_order,is_open").order("sort_order"),
      supabase.from("submissions").select("rm_id,month_id,ape,frp,policies,submitted_at"),
      supabase.from("assignments").select("rm_id,month_id,target,quality_score"),
      supabase.from("certifications").select("rm_id,ulip,endowment,term"),
      supabase.from("coaching_notes").select("rm_id,note"),
    ]);

  return {
    profile: session.profile,
    team: (team ?? []) as Profile[],
    months: (months ?? []) as MonthRow[],
    submissions: (submissions ?? []) as Submission[],
    assignments: (assignments ?? []) as Assignment[],
    certs: (certs ?? []) as Certification[],
    notes: (notes ?? []) as CoachingNote[],
    mode: "live",
  };
}
