"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail, ShieldAlert } from "lucide-react";
import { C, PrimaryButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { DemoEntry, type DeskPick } from "@/components/demo-entry";

export default function LoginForm({
  supabaseEnabled,
  teamLead,
  rms,
}: {
  supabaseEnabled: boolean;
  teamLead: DeskPick;
  rms: DeskPick[];
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    if (!email.trim() || !supabaseEnabled) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (authError) setError(authError.message);
    else setSent(true);
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside
        className="hero-grid hidden flex-col justify-between px-10 py-12 text-white lg:flex"
        style={{ paddingTop: "max(3rem, env(safe-area-inset-top))" }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: C.gold }}>
            Atlas Life · production desk
          </p>
          <h1 className="serif mt-6 text-5xl font-semibold leading-[0.92] tracking-tight">Team Victory</h1>
          <p className="serif mt-3 text-4xl font-medium" style={{ color: C.gold }}>
            Cross Sell
          </p>
          <div className="mt-8 h-px w-16" style={{ background: C.gold }} />
          <p className="mt-8 max-w-sm text-sm leading-7" style={{ color: C.ice }}>
            Sign in as the team lead for the full book, or as a relationship manager for an isolated desk. Access is
            enforced in the database, not in the browser.
          </p>
        </div>
        <p className="text-xs" style={{ color: C.ice }}>
          Kapil Sharma · Team lead
        </p>
      </aside>

      <div
        className="flex items-center justify-center p-4 safe-bottom sm:p-8"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="w-full max-w-lg">
          <div className="mb-6 lg:hidden">
            <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: C.gold }}>
              Production desk
            </p>
            <h1 className="serif mt-2 text-3xl font-semibold" style={{ color: C.ink }}>
              Team Victory
            </h1>
            <p className="serif text-2xl" style={{ color: C.navy }}>
              Cross Sell
            </p>
          </div>
          <div className="desk-card overflow-hidden">
            <div className="px-6 py-5" style={{ background: C.navy }}>
              <div className="text-lg font-semibold text-white">Open a desk</div>
              <div className="mt-1 text-xs leading-5" style={{ color: C.ice }}>
                {supabaseEnabled
                  ? "Sign in with your work email, or open a seeded desk below."
                  : "Select Kapil Sharma or a relationship manager. Use search if the book is long."}
              </div>
            </div>
            <div className="p-6">
              {supabaseEnabled ? (
                sent ? (
                  <div className="py-4 text-center">
                    <Check size={26} style={{ color: C.green }} className="mx-auto mb-3" />
                    <div className="mb-1 text-sm font-semibold" style={{ color: C.ink }}>
                      Check your inbox
                    </div>
                    <div className="text-sm" style={{ color: C.slate }}>
                      We sent a sign-in link to {email}. It expires in an hour.
                    </div>
                    <button onClick={() => setSent(false)} className="mt-4 text-xs underline" style={{ color: C.slate }}>
                      Use a different email
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="mb-2 block text-sm" style={{ color: C.slate }}>
                      Work email
                    </label>
                    <input
                      type="email"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void signIn();
                      }}
                      placeholder="you@company.com"
                      className="desk-input mb-3 w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{
                        border: `1px solid ${error ? "#F0C4B8" : C.line}`,
                        background: C.panel,
                        color: C.ink,
                      }}
                    />
                    {error ? (
                      <div className="mb-3 text-xs" style={{ color: C.red }}>
                        {error}
                      </div>
                    ) : null}
                    <PrimaryButton onClick={() => void signIn()} icon={Mail} disabled={busy || !email.trim()} block>
                      {busy ? "Sending…" : "Email me a sign-in link"}
                    </PrimaryButton>
                  </>
                )
              ) : null}
              <div className={supabaseEnabled ? "mt-6 border-t pt-5" : ""} style={{ borderColor: C.line }}>
                <p className="mb-3 text-xs" style={{ color: C.slate }}>
                  {supabaseEnabled ? "Or open a seeded desk" : "Who should we open the desk as?"}
                </p>
                <DemoEntry supabaseEnabled={false} embed teamLead={teamLead} rms={rms} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: C.amberBg, border: "1px solid #EBD3AE" }}>
            <ShieldAlert size={16} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
            <div className="text-xs leading-5" style={{ color: C.ink }}>
              Relationship managers see only their own figures. Team leads see the whole team.{" "}
              <Link href="/how-it-works" prefetch={false} className="underline">
                How access works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
