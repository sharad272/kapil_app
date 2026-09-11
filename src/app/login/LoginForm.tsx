"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail, ShieldAlert } from "lucide-react";
import { C, PrimaryButton } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { DemoEntry } from "@/components/demo-entry";

export default function LoginForm({ supabaseEnabled }: { supabaseEnabled: boolean }) {
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
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-lg" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <div className="px-6 py-5" style={{ background: C.navy }}>
            <div className="text-lg font-semibold text-white">RM Productivity Portal</div>
            <div className="mt-1 text-xs" style={{ color: C.ice }}>
              {supabaseEnabled ? "Sign in with your work email. We'll send you a link." : "Preview the desk, or connect Supabase for magic-link sign-in."}
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
                    className="mb-3 w-full rounded px-3 py-2.5 text-sm outline-none"
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
                  <PrimaryButton onClick={() => void signIn()} icon={Mail} disabled={busy || !email.trim()}>
                    {busy ? "Sending…" : "Email me a sign-in link"}
                  </PrimaryButton>
                </>
              )
            ) : null}
            <div className={supabaseEnabled ? "mt-6 border-t pt-5" : ""} style={{ borderColor: C.line }}>
              <p className="mb-3 text-xs" style={{ color: C.slate }}>
                Or preview with seeded figures
              </p>
              <DemoEntry supabaseEnabled={false} embed />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: C.amberBg, border: "1px solid #EBD3AE" }}>
          <ShieldAlert size={16} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
          <div className="text-xs" style={{ color: C.ink }}>
            Relationship managers see only their own figures. Team leads see the whole team. Access is enforced in the
            database, not in the browser.{" "}
            <Link href="/how-it-works" className="underline">
              How it works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
