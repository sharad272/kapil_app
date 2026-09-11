import { cacheLife } from "next/cache";
import Link from "next/link";
import { hasSupabase, C } from "@/lib/theme";
import { DEMO_RMS, DEMO_TL } from "@/lib/demo-data";
import { DemoEntry } from "@/components/demo-entry";
import { BrandHero } from "@/components/brand-hero";
import { ThemeToggle } from "@/components/india-theme";

const POINTS = [
  {
    title: "Isolated RM desks",
    body: "Each relationship manager sees only their APE, FRP, policies and certifications. Neighbouring books stay out of view.",
  },
  {
    title: "Team-lead console",
    body: "Kapil Sharma sees the full roster — targets, quality scores, huddle flags and coaching notes in one place.",
  },
  {
    title: "Plain-English filter",
    body: "Ask who is behind target. Send an in-app notice. It lands on that RM’s inbox the same morning.",
  },
];

export async function Landing() {
  "use cache";
  cacheLife("days");
  return (
    <div className="min-h-dvh" style={{ background: C.paper }}>
      <header
        className="desk-header px-4 py-4 sm:px-6 sm:py-5"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="serif text-sm font-semibold tracking-wide" style={{ color: C.onNavy }}>
              Team Victory
            </p>
            <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: C.gold }}>
              Cross Sell
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              href="/how-it-works"
              prefetch={false}
              className="desk-btn min-h-11 inline-flex items-center rounded-lg px-3 text-xs"
              style={{ color: C.ice, border: `1px solid ${C.navyMid}` }}
            >
              How access works
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <BrandHero
              kicker="Kapil Sharma · production desk"
              sub="Monthly APE, FRP, quality and certifications — formally separated. The team lead sees the whole book. Relationship managers see only their own figures."
            />
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-2 sm:gap-4">
              {[
                ["6", "RMs on the book"],
                ["Sep’26", "Open month"],
                ["₹6L", "APE target"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="serif text-2xl font-semibold" style={{ color: C.heading }}>
                    {k}
                  </dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: C.slate }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="desk-card p-6 sm:p-7">
            <p className="text-sm font-semibold" style={{ color: C.ink }}>
              Open the desk
            </p>
            <p className="mt-1 text-xs leading-5" style={{ color: C.slate }}>
              Choose Kapil Sharma or a relationship manager. Search the roster if you already know the name.
            </p>
            <DemoEntry
              supabaseEnabled={hasSupabase()}
              teamLead={{ id: DEMO_TL.id, full_name: DEMO_TL.full_name, email: DEMO_TL.email }}
              rms={DEMO_RMS.map((rm) => ({ id: rm.id, full_name: rm.full_name, email: rm.email }))}
            />
          </div>
        </div>
        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {POINTS.map((p) => (
            <article key={p.title} className="desk-card desk-card-hover p-5">
              <h2 className="text-sm font-semibold" style={{ color: C.ink }}>
                {p.title}
              </h2>
              <p className="mt-2 text-xs leading-6" style={{ color: C.slate }}>
                {p.body}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
