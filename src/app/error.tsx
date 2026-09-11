"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "#C9A24B" }}>
        Error
      </p>
      <h1 className="mt-2 text-3xl font-semibold" style={{ color: "#1B1F3B" }}>
        The desk couldn&apos;t load this view.
      </h1>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md px-3.5 py-2 text-sm text-white"
        style={{ background: "#1E2761" }}
      >
        Retry
      </button>
    </div>
  );
}
