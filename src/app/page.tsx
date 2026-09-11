import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Landing } from "@/components/landing";
import { getSession } from "@/lib/session";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#F7F8FC" }} />}>
      <HomeGate />
    </Suspense>
  );
}

async function HomeGate() {
  const session = await getSession();
  if (session) redirect(session.profile.role === "tl" ? "/tl" : "/rm");
  return <Landing />;
}
