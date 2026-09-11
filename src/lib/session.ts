import { cookies } from "next/headers";
import { DEMO_COOKIE, hasSupabase } from "@/lib/theme";
import { demoProfile } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Session } from "@/lib/types";

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const demo = jar.get(DEMO_COOKIE)?.value;
  if (demo) {
    const profile = demoProfile(demo);
    if (profile) return { profile, mode: "demo" };
  }

  if (!hasSupabase()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return null;
  return { profile: data as Profile, mode: "live" };
}
