import { C } from "@/lib/theme";

export function BrandHero({
  compact = false,
  kicker,
  sub,
}: {
  compact?: boolean;
  kicker?: string;
  sub?: string;
}) {
  if (compact) {
    return (
      <section className="hero-grid relative overflow-hidden rounded-2xl px-5 py-9 sm:px-8 sm:py-11">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: "rgba(201,162,75,0.16)" }}
        />
        <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
          {kicker ?? "Dashboard"}
        </p>
        <h1 className="serif mt-3 text-[2.15rem] font-semibold leading-[0.92] tracking-tight text-white sm:text-4xl lg:text-6xl">
          Team Victory
        </h1>
        <p className="serif mt-2 text-2xl font-medium leading-none tracking-tight sm:text-3xl lg:text-5xl" style={{ color: C.gold }}>
          Cross Sell
        </p>
        <div className="mt-5 h-px w-16" style={{ background: C.gold }} />
        {sub ? (
          <p className="mt-4 max-w-xl text-sm leading-6" style={{ color: C.ice }}>
            {sub}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: C.gold }}>
        {kicker ?? "Production desk"}
      </p>
      <h1 className="serif mt-4 text-[2.5rem] font-semibold leading-[0.9] tracking-tight sm:text-5xl lg:text-7xl" style={{ color: C.ink }}>
        Team Victory
      </h1>
      <p className="serif mt-3 text-3xl font-medium leading-none tracking-tight sm:text-4xl lg:text-6xl" style={{ color: C.heading }}>
        Cross Sell
      </p>
      <div className="mt-6 h-px w-20" style={{ background: C.gold }} />
      {sub ? (
        <p className="mt-5 max-w-xl text-sm leading-7" style={{ color: C.slate }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
