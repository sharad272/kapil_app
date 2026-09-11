import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { C } from "@/lib/theme";

export const metadata: Metadata = {
  title: "How access works",
  description: "Row-level security, cached public shell, coalesced writes.",
};

export default async function HowItWorksPage() {
  "use cache";
  cacheLife("days");

  return (
    <div className="min-h-dvh" style={{ background: C.paper }}>
      <header className="desk-header px-4 py-4 sm:px-6 sm:py-5" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/" prefetch={false} className="serif min-h-11 inline-flex items-center text-sm font-semibold" style={{ color: C.onNavy }}>
            Team Victory
          </Link>
          <Link
            href="/login"
            prefetch={false}
            className="desk-btn min-h-11 inline-flex items-center rounded-lg px-3 text-xs"
            style={{ color: C.ice, border: `1px solid ${C.navyMid}` }}
          >
            Sign in
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: C.gold }}>
          For a reviewer who already knows this stack
        </p>
        <h1 className="serif mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: C.ink }}>
          The catalog of figures is cheap. Another RM&apos;s row is not yours.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7" style={{ color: C.slate }}>
          This page is cached. It does not read cookies or inventory. The same split runs the product: public
          explanation on the CDN, private numbers only after a session, and writes coalesced so a team of RMs
          typing at month-end is not a row of single-character upserts.
        </p>

        <div className="desk-card mt-10 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.14em]" style={{ color: C.slate }}>
                <th className="border-b py-3 pr-4 font-medium" style={{ borderColor: C.ink }}>
                  Data
                </th>
                <th className="border-b py-3 pr-4 font-medium" style={{ borderColor: C.ink }}>
                  RM
                </th>
                <th className="border-b py-3 font-medium" style={{ borderColor: C.ink }}>
                  Team lead
                </th>
              </tr>
            </thead>
            <tbody style={{ color: C.slate }}>
              <Row k="Own APE / FRP / policies" rm="read + write" tl="read + correct" />
              <Row k="Another RM's figures" rm="no access" tl="read + correct" />
              <Row k="Targets, quality scores" rm="read own only" tl="read + write all" />
              <Row k="Own certification scores" rm="read + write" tl="read + correct" />
              <Row k="Coaching notes" rm="no access" tl="read + write" />
              <Row k="In-app notices" rm="own inbox + acknowledge" tl="filter + send" />
            </tbody>
          </table>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="desk-card p-6">
            <h2 className="text-xl font-semibold" style={{ color: C.ink }}>
              Under load
            </h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6" style={{ color: C.slate }}>
              <li>
                <span style={{ color: C.ink }}>Public routes are a static shell.</span> Login and this page use Cache
                Components. They never share a lock with submissions.
              </li>
              <li>
                <span style={{ color: C.ink }}>Auth work stays in proxy.ts.</span> Session refresh happens before the
                page. Static assets are excluded from the matcher.
              </li>
              <li>
                <span style={{ color: C.ink }}>Writes are debounced 450ms.</span> Month-end typing is one upsert per
                field, not one per keystroke.
              </li>
              <li>
                <span style={{ color: C.ink }}>Queries are narrow.</span> RM pages select only that RM&apos;s rows.
                Column lists are explicit. RLS is the real gate.
              </li>
            </ul>
          </div>
          <div className="desk-card p-6">
            <h2 className="text-xl font-semibold" style={{ color: C.ink }}>
              Production swap
            </h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6" style={{ color: C.slate }}>
              <li>Run <code>supabase/schema.sql</code> and set the three env vars.</li>
              <li>Promote a team lead with <code>update profiles set role = &apos;tl&apos;</code>.</li>
              <li>Quality remains TL-owned. Do not add an RM write policy on assignments.</li>
              <li>Closed months should fail writes in policy once you enforce <code>months.is_open</code>.</li>
            </ul>
          </div>
        </section>
      </article>
    </div>
  );
}

function Row({ k, rm, tl }: { k: string; rm: string; tl: string }) {
  return (
    <tr className="align-top" style={{ borderBottom: `1px solid ${C.line}` }}>
      <td className="py-3 pr-4" style={{ color: C.ink }}>
        {k}
      </td>
      <td className="py-3 pr-4">{rm}</td>
      <td className="py-3">{tl}</td>
    </tr>
  );
}
