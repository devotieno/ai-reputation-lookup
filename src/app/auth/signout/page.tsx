"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignOut() {
  const [leaving, setLeaving] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 9rem)", padding: "2rem 1rem" }}>
      <div className="card" style={{ padding: "2rem", width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.375rem" }}>Sign out?</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginBottom: "1.5rem" }}>You can always sign back in.</p>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <Link href="/" className="btn btn-ghost" style={{ flex: 1 }}>Cancel</Link>
          <button
            onClick={() => { setLeaving(true); signOut({ callbackUrl: "/" }); }}
            disabled={leaving}
            className="btn"
            style={{ flex: 1, background: "rgba(239,68,68,0.9)", color: "white", border: "1px solid rgba(239,68,68,0.5)" }}
          >
            {leaving ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
