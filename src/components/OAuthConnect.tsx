"use client";

import React from "react";

const PLATFORMS = [
  { name: "LinkedIn",   href: "/api/auth/linkedin/start",  color: "#0a66c2" },
  { name: "X (Twitter)",href: "/api/auth/twitter/start",   color: "#e7e7e7" },
  { name: "Reddit",     href: "/api/auth/reddit/start",    color: "#ff4500" },
  { name: "YouTube",    href: "/api/auth/youtube/start",   color: "#ff0000" },
  { name: "Instagram",  href: "/api/auth/instagram/start", color: "#e1306c" },
];

export default function OAuthConnect() {
  return (
    <div
      style={{
        marginTop: "0.75rem",
        padding: "1.125rem 1.5rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div style={{ flex: "1 1 200px" }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
          Connect accounts for deeper analysis
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0.25rem 0 0" }}>
          Read-only. Credentials never stored.
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {PLATFORMS.map((p) => (
          <a
            key={p.name}
            href={p.href}
            className="btn btn-ghost"
            style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", gap: "0.375rem" }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0, display: "inline-block" }} />
            {p.name}
          </a>
        ))}
      </div>
    </div>
  );
}
