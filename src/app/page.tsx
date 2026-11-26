"use client";

import UserInputForm from "../components/UserInputForm";
import ProcessingIndicator from "../components/ProcessingIndicatorSimple";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { JSX } from "react";
import * as apiClient from "@/utils/api";
import { DEMO_RESULTS } from "@/lib/demoData";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export type UserInput = {
  name: string;
  twitter?: string;
  linkedin?: string;
  reddit?: string;
  youtube?: string;
  instagram?: string;
  github?: string;
  email?: string;
  photo?: File | null;
};

/* ── Category metadata ───────────────────────────────── */
const CAT: Record<string, { label: string; icon: JSX.Element }> = {
  professionalism:  { label: "Professionalism",              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  toneAndLanguage:  { label: "Tone & Language",              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  sentiment:        { label: "Sentiment",                    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
  consistency:      { label: "Consistency",                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  authenticity:     { label: "Authenticity",                 icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  socialRiskProfile:{ label: "Social Risk",                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  onlineExposure:   { label: "Online Exposure",              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  positiveMarkers:  { label: "Positive Markers",             icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
};

/* ── Score helpers ───────────────────────────────────── */
function scoreMeta(score: number) {
  if (score >= 80) return { color: "#4ade80", label: "Good" };
  if (score >= 60) return { color: "#fbbf24", label: "Fair" };
  return { color: "#f87171", label: "Low" };
}

/* ── Category row ────────────────────────────────────── */
function CategoryRow({ name, data }: { name: string; data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const [evOpen, setEvOpen] = useState(false);
  const [flOpen, setFlOpen] = useState(false);

  const meta   = CAT[name] ?? { label: name.charAt(0).toUpperCase() + name.slice(1), icon: null };
  const score  = data?.score as number | undefined;
  const sm     = score !== undefined ? scoreMeta(score) : null;
  const narrative  = data?.narrative as string | undefined;
  const summary    = data?.summary as string | undefined;
  const platforms  = data?.platforms as string[] | undefined;
  const evidence   = data?.evidenceWithSources as unknown[] | undefined;
  const flaggedContent = data?.flaggedContent as unknown[] | undefined;
  const flagged    = data?.flagged as unknown[] | undefined;
  const flagList   = flaggedContent?.length ? flaggedContent : flagged;

  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      {/* Header */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.025)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "none")}
      >
        {/* icon */}
        <span style={{ color: "var(--text-3)", flexShrink: 0 }}>{meta.icon}</span>

        {/* label */}
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
          {meta.label}
        </span>

        {/* platforms */}
        {platforms && platforms.length > 0 && (
          <span style={{ fontSize: "0.7rem", color: "var(--text-3)", display: "none" }} className="sm:block">
            {platforms.join(" · ")}
          </span>
        )}

        {/* score */}
        {sm && score !== undefined && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: sm.color,
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              {score}
            </span>
            <div style={{ width: 48, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, background: sm.color, borderRadius: 99 }} />
            </div>
          </span>
        )}

        {/* flag badge */}
        {flagList && flagList.length > 0 && (
          <span className="badge badge-amber" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
            {flagList.length} flagged
          </span>
        )}

        {/* chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          {/* Narrative */}
          <div style={{ padding: "1rem 0", fontSize: "0.8125rem", color: "var(--text-2)", lineHeight: 1.7 }}>
            {narrative ? (
              <div dangerouslySetInnerHTML={{
                __html: narrative
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-1)">$1</strong>')
                  .replace(/## (.*?)$/gm, '<p style="font-size:0.875rem;font-weight:600;color:var(--text-1);margin:1rem 0 0.25rem">$1</p>')
                  .replace(/\n/g, "<br/>"),
              }} />
            ) : (
              <p style={{ margin: 0 }}>{summary ?? "No analysis available."}</p>
            )}
          </div>

          {/* Evidence */}
          {evidence && evidence.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <button
                onClick={() => setEvOpen((p) => !p)}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "var(--accent-hi)", fontWeight: 500, padding: 0 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: evOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Evidence ({evidence.length})
              </button>
              {evOpen && (
                <div style={{ marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(evidence as Array<Record<string, string>>).slice(0, 5).map((ev, i) => (
                    <div key={i} className="inset" style={{ padding: "0.75rem" }}>
                      <blockquote style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-2)", fontStyle: "italic", borderLeft: "2px solid var(--accent)", paddingLeft: "0.625rem", lineHeight: 1.5 }}>
                        {ev.quote}
                      </blockquote>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem", fontSize: "0.7rem", color: "var(--text-3)" }}>
                        {ev.platform && <span>Platform: {ev.platform}</span>}
                        {ev.author && <span>Author: {ev.author}</span>}
                        {ev.date && <span>{ev.date}</span>}
                        {ev.url && ev.url !== "#" && <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-hi)" }}>View ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flagged */}
          {flagList && flagList.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <button
                onClick={() => setFlOpen((p) => !p)}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "#fbbf24", fontWeight: 500, padding: 0 }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: flOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                {flagList.length} Flagged items
              </button>
              {flOpen && (
                <div style={{ marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(flagList as Array<Record<string, unknown>>).map((item, i) => {
                    const reason   = item.reason != null ? String(item.reason) : null;
                    const content  = String(item.content ?? item.excerpt ?? "");
                    const platform = item.platform != null ? String(item.platform) : null;
                    const date     = item.date != null ? String(item.date) : null;
                    const severity = item.severity != null ? String(item.severity) : null;
                    const url      = item.url != null && item.url !== "#" ? String(item.url) : null;
                    const sevColor = severity === "high" ? "#f87171" : severity === "medium" ? "#fbbf24" : "#4ade80";
                    return (
                      <div key={i} className="inset" style={{ padding: "0.75rem", borderColor: "rgba(245,158,11,0.2)" }}>
                        {reason && <p style={{ margin: "0 0 0.375rem", fontSize: "0.75rem", fontWeight: 600, color: "#fbbf24" }}>{reason}</p>}
                        <blockquote style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-2)", fontStyle: "italic", borderLeft: "2px solid rgba(245,158,11,0.4)", paddingLeft: "0.625rem", lineHeight: 1.5 }}>
                          {content}
                        </blockquote>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem", fontSize: "0.7rem", color: "var(--text-3)" }}>
                          {platform && <span>Platform: {platform}</span>}
                          {date && <span>{date}</span>}
                          {severity && <span style={{ color: sevColor, fontWeight: 600 }}>{severity.toUpperCase()}</span>}
                          {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-hi)" }}>View ↗</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ Main page ══════════════════════════════════════════ */
export default function HomePage() {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "results">("form");
  const [userName, setUserName] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<NodeJS.Timeout | null>(null);
  const demoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const catCount = useMemo(() => Object.keys(results).length, [results]);

  useEffect(() => () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
  }, []);

  const pollForResults = useCallback(async (userId: string) => {
    if (isPolling) return;
    setIsPolling(true);
    let attempts = 0;
    const MAX = 40;

    const poll = async () => {
      attempts++;
      try {
        const { results: res } = await apiClient.getAnalysisResults(userId);
        const hasData = res && Object.keys(res).length > 0 &&
          Object.keys(res).some((k) => {
            const d = res[k] as { summary?: string; flagged?: unknown[] };
            return d?.summary && d.summary !== "No data available for analysis.";
          });
        const partial = attempts >= 6 && res && Object.keys(res).length > 0;

        if (hasData || partial) {
          setResults(res);
          setLoading(false);
          setStep("results");
          setIsPolling(false);
          return;
        }
        if (attempts % 5 === 0) fetch("/api/processJobs", { method: "GET", cache: "no-store" }).catch(() => {});
        if (attempts < MAX) {
          pollRef.current = setTimeout(poll, 3000);
        } else {
          setLoading(false); setStep("form"); setIsPolling(false); setSubmitDisabled(false);
          alert("Analysis timed out. Please try again.");
        }
      } catch {
        if (attempts < MAX) { pollRef.current = setTimeout(poll, 3000); }
        else { setLoading(false); setStep("form"); setIsPolling(false); setSubmitDisabled(false); }
      }
    };
    poll();
  }, [isPolling]);

  const handleSubmit = useCallback(async (data: UserInput) => {
    if (loading || submitDisabled) return;
    setSubmitDisabled(true); setLoading(true);
    setIsDemoMode(false);
    setResults({}); setStep("processing"); setUserName(data.name);
    try {
      const { userId } = await apiClient.submitUserInput(data);
      await fetch(`/api/processJobs?userId=${userId}`, { method: "GET", cache: "no-store" }).catch(() => {});
      pollForResults(userId);
    } catch {
      setLoading(false); setStep("form"); setSubmitDisabled(false);
      alert("Error submitting request. Please try again.");
    }
  }, [loading, submitDisabled, pollForResults]);

  const handleDemo = useCallback(() => {
    if (loading || submitDisabled) return;
    setLoading(true);
    setSubmitDisabled(true);
    setResults({});
    setUserName("Alex Jordan");
    setIsDemoMode(true);
    setStep("processing");
    demoTimeoutRef.current = setTimeout(() => {
      setResults(DEMO_RESULTS);
      setLoading(false);
      setSubmitDisabled(false);
      setStep("results");
      demoTimeoutRef.current = null;
    }, 2000);
  }, [loading, submitDisabled]);

  const handlePDF = useCallback(async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 1, useCORS: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      const imgData = canvas.toDataURL("image/png");
      const props = pdf.getImageProperties(imgData);
      pdf.addImage(imgData, "PNG", 0, 0, w, (props.height * w) / props.width);
      pdf.save(`${userName || "report"}-reputation.pdf`);
    } catch { alert("PDF generation failed."); }
    finally { setLoading(false); }
  }, [userName]);

  const reset = useCallback(() => {
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    if (demoTimeoutRef.current) { clearTimeout(demoTimeoutRef.current); demoTimeoutRef.current = null; }
    setIsPolling(false); setLoading(false); setStep("form");
    setSubmitDisabled(false); setResults({}); setUserName(""); setIsDemoMode(false);
  }, []);

  /* ── Form step ──────────────────────────────────────── */
  if (step === "form") return (
    <div style={{ maxWidth: 740, margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.3rem 0.75rem", borderRadius: 99, border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)", fontSize: "0.75rem", color: "var(--accent-hi)", fontWeight: 500, marginBottom: "1.25rem" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
          </svg>
          AI-powered reputation intelligence
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: "0.875rem" }}>
          Know what the internet<br />
          <span className="grad">says about anyone.</span>
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-2)", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
          Enter a name and social handles. Our AI scans public sources to build a comprehensive reputation report in minutes.
        </p>
        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          className="btn btn-ghost"
          style={{ marginTop: "1.25rem", fontSize: "0.875rem" }}
        >
          Try Demo →
        </button>
      </div>

      {/* Form */}
      <UserInputForm
        onSubmit={handleSubmit}
        disabled={submitDisabled}
      />

      {/* How it works */}
      <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[
          { n: "1", title: "Enter details", desc: "Name and any social handles you have." },
          { n: "2", title: "AI scans sources", desc: "Public posts, mentions & web results." },
          { n: "3", title: "Get the report", desc: "Scored across 8 reputation dimensions." },
        ].map((s) => (
          <div key={s.n} style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-hi)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", fontFamily: "var(--font-geist-mono), monospace" }}>
              {s.n}
            </div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-1)", marginBottom: "0.25rem" }}>{s.title}</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Processing step ────────────────────────────────── */
  if (step === "processing") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <ProcessingIndicator name={userName} />
    </div>
  );

  /* ── Results step ───────────────────────────────────── */
  return (
    <div style={{ maxWidth: 740, margin: "0 auto" }}>
      {/* Results header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <span className="badge">
              Public analysis
            </span>
            {isDemoMode && (
              <span className="badge badge-amber">
                Demo · Sample data
              </span>
            )}
            <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
              {catCount} {catCount === 1 ? "category" : "categories"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
            {userName || "Subject"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isDemoMode && (
            <button onClick={reset} className="btn btn-ghost" style={{ fontSize: "0.8125rem" }}>
              Try with real data →
            </button>
          )}
          <button onClick={reset} className="btn btn-ghost" style={{ fontSize: "0.8125rem" }}>
            ← New analysis
          </button>
          <button onClick={handlePDF} disabled={loading} className="btn btn-primary" style={{ fontSize: "0.8125rem" }}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Results table */}
      <div ref={reportRef} className="card" style={{ overflow: "hidden" }}>
        {catCount === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-3)", fontSize: "0.875rem" }}>
            No results yet.
          </div>
        ) : (
          <div>
            {/* Table head */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <span style={{ flex: 1, fontSize: "0.7rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Category</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginRight: "1.5rem" }}>Score</span>
            </div>
            {Object.entries(results).map(([key, val]) => (
              <CategoryRow key={key} name={key} data={val as Record<string, unknown>} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
