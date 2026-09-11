import { cacheLife } from "next/cache";
import Link from "next/link";
import { hasSupabase } from "@/lib/theme";
import { DemoEntry } from "@/components/demo-entry";

export async function Landing() {
  "use cache";
  cacheLife("days");
  return (
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <header className="px-6 py-5" style={{ background: "#1E2761" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-sm font-semibold tracking-wide text-white">RM Productivity Portal</p>
          <Link href="/how-it-works" className="text-xs" style={{ color: "#CADCFC" }}>
            How access works
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: "#C9A24B" }}>
            Life insurance production desk
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl" style={{ color: "#1B1F3B" }}>
            Monthly APE, FRP, quality and certifications — without RMs seeing each other.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7" style={{ color: "#5B6484" }}>
            Relationship managers submit their own figures. The team lead sees the whole book. Quality scores are
            audit-owned, not self-reported. Access is enforced in Postgres with row-level security, not in the browser.
          </p>
          <ul className="mt-8 grid gap-3 text-sm" style={{ color: "#1B1F3B" }}>
            <li>RM workspace — own APE / FRP / policies and certification scores</li>
            <li>TL console — leaderboard, targets, corrections, coaching notes</li>
            <li>Writes are coalesced; the public shell is cached; sessions refresh at the edge</li>
          </ul>
        </div>
        <div className="rounded-lg p-6" style={{ background: "#fff", border: "1px solid #E2E6F2" }}>
          <p className="text-sm font-semibold" style={{ color: "#1B1F3B" }}>
            Open the desk
          </p>
          <p className="mt-1 text-xs" style={{ color: "#5B6484" }}>
            Preview uses seeded Atlas Life figures. Connect Supabase for magic-link sign-in and live RLS.
          </p>
          <DemoEntry supabaseEnabled={hasSupabase()} />
        </div>
      </main>
    </div>
  );
}
