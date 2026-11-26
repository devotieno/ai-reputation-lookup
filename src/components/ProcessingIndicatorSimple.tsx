"use client";

import React, { useState, useEffect } from "react";

interface Props { name: string; }

const STEPS = [
  "Collecting public social profiles",
  "Scanning web mentions & search results",
  "Running AI sentiment analysis",
  "Evaluating tone, consistency & risk",
  "Generating comprehensive report",
];

export default function ProcessingIndicator({ name }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(0); // 0–100 simulated progress
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((p) => {
        const next = Math.min(99, p + (p < 40 ? 1.1 : p < 75 ? 0.5 : 0.18));
        const step = STEPS.findIndex((_, i) => next < (i + 1) * (99 / STEPS.length));
        setStepIdx(step === -1 ? STEPS.length - 1 : step);
        return next;
      });
    }, 400);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="card" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>

        {/* Spinner ring */}
        <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 1.75rem" }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="var(--accent)" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - tick / 100)}`}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.03em" }}>
              {Math.round(tick)}%
            </span>
          </div>
        </div>

        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.375rem" }}>
          Analysing <span style={{ color: "var(--accent-hi)" }}>{name || "subject"}</span>
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", marginBottom: "1.75rem" }}>
          Gathering and cross-referencing public data
        </p>

        {/* Steps */}
        <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
          {STEPS.map((step, i) => {
            const done   = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem 0.625rem",
                  borderRadius: 7,
                  marginBottom: "0.25rem",
                  background: active ? "rgba(139,92,246,0.08)" : "transparent",
                  border: `1px solid ${active ? "rgba(139,92,246,0.2)" : "transparent"}`,
                  transition: "background 0.3s, border-color 0.3s",
                  opacity: i > stepIdx ? 0.35 : 1,
                }}
              >
                {/* dot */}
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "rgba(34,197,94,0.15)" : active ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${done ? "rgba(34,197,94,0.3)" : active ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}>
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : active ? (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "block", animation: "pulse 1s infinite" }} />
                  ) : (
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "block" }} />
                  )}
                </div>
                <span style={{
                  fontSize: "0.8125rem",
                  color: done ? "var(--text-3)" : active ? "var(--text-1)" : "var(--text-3)",
                  fontWeight: active ? 500 : 400,
                  textDecoration: done ? "line-through" : "none",
                }}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", fontSize: "0.75rem", color: "var(--text-3)" }}>
          <span>⏱ {fmt(elapsed)}</span>
          {elapsed > 60 && <span style={{ color: "#fbbf24" }}>Large dataset — a few more minutes</span>}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
