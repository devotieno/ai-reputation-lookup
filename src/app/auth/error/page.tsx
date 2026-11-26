"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const MSGS: Record<string, string> = {
  Configuration: "Server configuration error. Please contact support.",
  AccessDenied: "You don't have permission to sign in.",
  Verification: "This verification link has expired or already been used.",
};

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const msg = error ? (MSGS[error] ?? "An unexpected error occurred.") : "An error occurred during authentication.";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 9rem)", padding: "2rem 1rem" }}>
      <div className="card" style={{ padding: "2rem", width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.375rem" }}>Authentication error</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginBottom: "1.5rem", lineHeight: 1.6 }}>{msg}</p>
        <Link href="/auth/signin" className="btn btn-primary" style={{ display: "inline-flex", padding: "0.5625rem 1.25rem" }}>
          Try again
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div />}>
      <ErrorContent />
    </Suspense>
  );
}
