import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { loadRM } from "@/lib/load";
import RMWorkspace from "./RMWorkspace";

export default function RMPage() {
  return (
    <Suspense fallback={<DeskSkeleton title="Opening your figures…" />}>
      <RMGate />
    </Suspense>
  );
}

async function RMGate() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role === "tl") redirect("/tl");
  const payload = await loadRM(session);
  return (
    <RMWorkspace
      profile={payload.profile}
      months={payload.months}
      initialSubmissions={payload.submissions}
      assignments={payload.assignments}
      initialCerts={payload.certs}
      mode={payload.mode}
    />
  );
}

function DeskSkeleton({ title }: { title: string }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      <div className="h-16" style={{ background: "var(--navy)" }} />
      <p className="px-6 py-10 text-sm" style={{ color: "var(--slate)" }}>
        {title}
      </p>
    </div>
  );
}
