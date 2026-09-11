"use client";

import { C } from "@/lib/theme";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: C.gold }}>
        Error
      </p>
      <h1 className="mt-2 text-3xl font-semibold" style={{ color: C.ink }}>
        The desk couldn&apos;t load this view.
      </h1>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md px-3.5 py-2 text-sm"
        style={{ background: C.navy, color: C.onNavy }}
      >
        Retry
      </button>
    </div>
  );
}
