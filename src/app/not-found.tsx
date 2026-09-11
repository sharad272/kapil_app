import Link from "next/link";
import { C } from "@/lib/theme";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24">
      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: C.gold }}>
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold" style={{ color: C.ink }}>
        This route is not on the desk.
      </h1>
      <Link href="/" className="mt-6 inline-flex rounded-md px-3.5 py-2 text-sm" style={{ background: C.navy, color: C.onNavy }}>
        Back to portal
      </Link>
    </div>
  );
}
