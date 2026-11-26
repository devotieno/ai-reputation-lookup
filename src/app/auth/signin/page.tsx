"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const ERR: Record<string, string> = {
  OAuthSignin: "Could not start sign-in. Please try again.",
  OAuthCallback: "Could not complete sign-in. Please try again.",
  EmailCreateAccount: "Could not create account. Please try again.",
  EmailSignin: "Could not send magic link. Please try again.",
  CredentialsSignin: "Invalid credentials.",
  authentication_required: "You must be signed in to access that page.",
};

function SignInContent() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const params = useSearchParams();
  const error = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const errMsg = error ? (ERR[error] ?? "An unexpected error occurred.") : null;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await signIn("email", { email, callbackUrl, redirect: true });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 9rem)", padding: "2rem 1rem" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo mark */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 0 0 1px rgba(139,92,246,0.5), 0 4px 16px rgba(139,92,246,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.03em" }}>AI Reputation Lookup</h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginTop: "0.25rem" }}>Sign in to access deeper analysis</p>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          {errMsg && (
            <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.8125rem", color: "#f87171" }}>
              {errMsg}
            </div>
          )}

          {/* Google */}
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="btn"
            style={{ width: "100%", background: "white", color: "#111", border: "1px solid #e2e2e2", padding: "0.6875rem", fontSize: "0.875rem", fontWeight: 500, gap: "0.625rem" }}
          >
            <FcGoogle style={{ fontSize: "1.125rem" }} />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.125rem 0" }}>
            <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>or</span>
            <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
          </div>

          {/* Email */}
          <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-2)", marginBottom: "0.375rem" }}>
                Email address
              </label>
              <input
                id="email"
                className="input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ fontSize: "0.875rem" }}
              />
            </div>
            <button type="submit" disabled={sending} className="btn btn-primary" style={{ width: "100%", padding: "0.6875rem" }}>
              {sending ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending…
                </>
              ) : "Send magic link"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/" style={{ fontSize: "0.75rem", color: "var(--text-3)", textDecoration: "none" }}>
            ← Back to home
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }} />}>
      <SignInContent />
    </Suspense>
  );
}
