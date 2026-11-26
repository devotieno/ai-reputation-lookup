"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "rgba(9,9,11,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.5), 0 2px 8px rgba(139,92,246,0.3)",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={{ fontWeight: 650, fontSize: "0.9rem", color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            AI Reputation
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1.5">
          {!session ? (
            <button
              onClick={() => signIn("google")}
              className="btn btn-primary"
              style={{ padding: "0.4rem 0.875rem", fontSize: "0.8125rem" }}
            >
              Sign in
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/settings"
                className="btn btn-ghost"
                style={{
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: pathname === "/settings" ? 700 : 500,
                  color: pathname === "/settings" ? "var(--accent-hi)" : undefined,
                  borderColor: pathname === "/settings" ? "rgba(139,92,246,0.3)" : undefined,
                  background: pathname === "/settings" ? "rgba(139,92,246,0.08)" : undefined,
                }}
              >
                Connections
              </Link>

              <div
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  padding: "0.3rem 0.5rem 0.3rem 0.3rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "Avatar"}
                    width={22}
                    height={22}
                    style={{ borderRadius: "50%", display: "block" }}
                  />
                )}
                <span style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {session.user?.name?.split(" ")[0]}
                </span>
              </div>

              <button
                onClick={() => signOut()}
                className="btn btn-ghost"
                style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem" }}
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
