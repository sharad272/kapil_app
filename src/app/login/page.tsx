import { Suspense } from "react";
import { cookies } from "next/headers";
import LoginForm from "./LoginForm";
import { DEMO_TL } from "@/lib/demo-data";
import { listTeam } from "@/lib/roster";
import { hasSupabase } from "@/lib/theme";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" style={{ background: "#F7F8FC" }} />}>
      <LoginGate />
    </Suspense>
  );
}

async function LoginGate() {
  await cookies();
  const rms = listTeam().map((rm) => ({ id: rm.id, full_name: rm.full_name, email: rm.email }));
  return (
    <LoginForm
      supabaseEnabled={hasSupabase()}
      teamLead={{ id: DEMO_TL.id, full_name: DEMO_TL.full_name, email: DEMO_TL.email }}
      rms={rms}
    />
  );
}
