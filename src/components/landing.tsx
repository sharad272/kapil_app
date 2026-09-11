import { cacheLife } from "next/cache";
import Link from "next/link";
import { hasSupabase } from "@/lib/theme";
import { DEMO_RMS, DEMO_TL } from "@/lib/demo-data";
import { DemoEntry } from "@/components/demo-entry";
import { BrandHero } from "@/components/brand-hero";

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
    <div className="min-h-dvh" style={{ background: "#F4F5FA" }}>
      <header
        className="px-4 py-4 sm:px-6 sm:py-5"
        style={{
          background: "linear-gradient(180deg, #10153A 0%, #1E2761 100%)",
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          borderBottom: "2px solid #C9A24B",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="serif text-sm font-semibold tracking-wide text-white">Team Victory</p>
            <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "#C9A24B" }}>
              Cross Sell
            </p>
          </div>
          <Link href="/how-it-works" className="desk-btn min-h-11 inline-flex items-center rounded-lg px-3 text-xs" style={{ color: "#CADCFC", border: "1px solid #2A3470" }}>
            How access works
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <BrandHero
              kicker="Kapil Sharma · production desk"
              sub="Monthly APE, FRP, quality and certifications — formally separated. The team lead sees the whole book. Relationship managers see only their own figures."
            />
            <dl className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              {[
                ["6", "RMs on the book"],
                ["Sep’26", "Open month"],
                ["₹6L", "APE target"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="serif text-2xl font-semibold" style={{ color: "#1E2761" }}>
                    {k}
                  </dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.12em]" style={{ color: "#5B6484" }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="desk-card p-6 sm:p-7">
            <p className="text-sm font-semibold" style={{ color: "#1B1F3B" }}>
              Open the desk
            </p>
            <p className="mt-1 text-xs leading-5" style={{ color: "#5B6484" }}>
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
              <h2 className="text-sm font-semibold" style={{ color: "#1B1F3B" }}>
                {p.title}
              </h2>
              <p className="mt-2 text-xs leading-6" style={{ color: "#5B6484" }}>
                {p.body}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
