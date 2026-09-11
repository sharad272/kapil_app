import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { loadTL } from "@/lib/load";
import TLConsole from "./TLConsole";

export default function TLPage() {
  return (
    <Suspense fallback={<DeskSkeleton />}>
      <TLGate />
    </Suspense>
  );
}

async function TLGate() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "tl") redirect("/rm");
  const payload = await loadTL(session);
  return (
    <TLConsole
      profile={payload.profile}
      team={payload.team}
      months={payload.months}
      initialSubmissions={payload.submissions}
      initialAssignments={payload.assignments}
      initialCerts={payload.certs}
      initialNotes={payload.notes}
      mode={payload.mode}
    />
  );
}

function DeskSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="h-16" style={{ background: "#1E2761" }} />
      <p className="px-6 py-10 text-sm" style={{ color: "#5B6484" }}>
        Opening the team console…
      </p>
    </div>
  );
}
