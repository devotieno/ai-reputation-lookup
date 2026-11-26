"use client";

import Link from "next/link";

export default function VerifyRequest() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 9rem)", padding: "2rem 1rem" }}>
      <div className="card" style={{ padding: "2rem", width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hi)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.375rem" }}>Check your email</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          A sign-in link has been sent. Check your inbox and spam folder.
        </p>
        <Link href="/auth/signin" style={{ fontSize: "0.8125rem", color: "var(--accent-hi)", textDecoration: "none" }}>
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
