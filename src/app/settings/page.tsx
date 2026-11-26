"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { redirect } from "next/navigation";
import Link from "next/link";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", tokenKey: "instagramAccessToken", nameKey: "instagramUsername", dateKey: "instagramConnectedAt", href: "/api/auth/instagram/start", dot: "#e1306c" },
  { id: "twitter",   label: "X (Twitter)", tokenKey: "twitterAccessToken", nameKey: "twitterUsername",   dateKey: "twitterConnectedAt",   href: "/api/auth/twitter/start",   dot: "#e7e7e7" },
  { id: "linkedin",  label: "LinkedIn",   tokenKey: "linkedinAccessToken", nameKey: "linkedinName",       dateKey: "linkedinConnectedAt",  href: "/api/auth/linkedin/start",  dot: "#0a66c2" },
  { id: "reddit",    label: "Reddit",     tokenKey: "redditAccessToken",   nameKey: "redditUsername",     dateKey: "redditConnectedAt",    href: "/api/auth/reddit/start",    dot: "#ff4500" },
  { id: "youtube",   label: "YouTube",    tokenKey: "youtubeAccessToken",  nameKey: "youtubeChannelTitle",dateKey: "youtubeConnectedAt",   href: "/api/auth/youtube/start",   dot: "#ff0000" },
];

export default function Settings() {
  const { data: session, status } = useSession();
  const [conns, setConns] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const str = (k: string) => { const v = conns[k]; return typeof v === "string" ? v : ""; };
  const dateStr = (k: string) => { const v = conns[k]; if (!v) return ""; try { return new Date(v as string).toLocaleDateString(); } catch { return ""; } };

  useEffect(() => { if (status === "unauthenticated") redirect("/api/auth/signin?callbackUrl=/settings"); }, [status]);
  useEffect(() => {
    if (session?.user?.id) {
      getDoc(doc(db, "users", session.user.id)).then((s) => { if (s.exists()) setConns(s.data()); }).catch(console.error).finally(() => setLoading(false));
    } else if (status !== "loading") setLoading(false);
  }, [session, status]);

  if (status === "loading" || loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <svg style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!session) return null;

  const connectedCount = PLATFORMS.filter((p) => Boolean(conns[p.tokenKey])).length;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <Link href="/" className="btn btn-ghost" style={{ padding: "0.3rem 0.625rem", fontSize: "0.8rem", marginBottom: "1rem", display: "inline-flex" }}>
          ← Home
        </Link>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>Settings</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>{session?.user?.email}</p>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "1.125rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)", margin: 0 }}>Social connections</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0.2rem 0 0" }}>Read-only OAuth — credentials never stored</p>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-3)", fontFamily: "var(--font-geist-mono), monospace" }}>
            {connectedCount}/{PLATFORMS.length}
          </span>
        </div>

        {/* Platform rows */}
        {PLATFORMS.map((p, i) => {
          const connected = Boolean(conns[p.tokenKey]);
          const name = str(p.nameKey);
          const date = dateStr(p.dateKey);
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "0.875rem 1.25rem",
                borderBottom: i < PLATFORMS.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)", margin: 0 }}>{p.label}</p>
                {connected ? (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0.1rem 0 0" }}>
                    {name ? `@${name}` : "Connected"}{date ? ` · ${date}` : ""}
                  </p>
                ) : (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0.1rem 0 0" }}>Not connected</p>
                )}
              </div>
              {connected ? (
                <span className="badge badge-green" style={{ fontSize: "0.7rem" }}>Connected</span>
              ) : (
                <Link href={p.href} className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
                  Connect
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
