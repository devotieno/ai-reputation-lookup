"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface FlaggedItem { content: string; reason: string; severity: "low"|"medium"|"high"; url: string; date?: string; }
interface Category { name: string; summary: string; flaggedContent: FlaggedItem[]; }
interface Quote { content: string; url: string; date: string; }
interface Report { id: string; name: string; createdAt: string; summaries: string[]; toxicityScore: number; quotes: Quote[]; categories: Category[]; }

function CategoryRow({ cat }: { cat: Category }) {
  const [open, setOpen] = useState(false);
  const hasFlagged = cat.flaggedContent?.length > 0;
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
      >
        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>{cat.name}</span>
        {hasFlagged && <span className="badge badge-amber" style={{ fontSize: "0.65rem" }}>{cat.flaggedContent.length} flagged</span>}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", lineHeight: 1.7, padding: "1rem 0" }}>{cat.summary}</p>
          {hasFlagged && cat.flaggedContent.map((item, i) => (
            <div key={i} className="inset" style={{ padding: "0.75rem", marginBottom: "0.5rem", borderColor: "rgba(245,158,11,0.2)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ color: item.severity === "high" ? "#f87171" : item.severity === "medium" ? "#fbbf24" : "#4ade80", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, marginTop: "0.1rem" }}>
                  {item.severity.toUpperCase()}
                </span>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>{item.content}</p>
              </div>
              {item.reason && <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: "0.375rem 0 0" }}>{item.reason}</p>}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.375rem", fontSize: "0.7rem", color: "var(--text-3)" }}>
                {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-hi)" }}>View ↗</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!id) throw new Error("No report ID");
        let snap = await getDoc(doc(db, "reports", id as string));
        if (!snap.exists()) {
          const q = query(collection(db, "analysisResults"), where("jobId", "==", id));
          const qs = await getDocs(q);
          if (qs.empty) { snap = await getDoc(doc(db, "analysisResults", id as string)); if (!snap.exists()) throw new Error("Report not found"); }
          else snap = qs.docs[0];
        }
        const raw = snap.data()!;
        const a = raw.analysis || raw;
        const r: Report = {
          id: snap.id, name: raw.name || "Unknown", createdAt: raw.createdAt || new Date().toISOString(),
          summaries: a.summaries || [], toxicityScore: a.toxicityScore || 0, quotes: a.quotes || [], categories: [],
        };
        if (a.categories) {
          r.categories = Object.entries(a.categories).map(([k, v]: [string, unknown]) => {
            const val = v as Record<string, unknown>;
            return {
              name: k.charAt(0).toUpperCase() + k.slice(1),
              summary: typeof val.summary === "string" ? val.summary : "",
              flaggedContent: Array.isArray(val.flagged) ? val.flagged.map((item: unknown) => {
                const fi = item as Record<string, unknown>;
                return { content: typeof fi === "string" ? fi : String(fi?.content ?? ""), reason: String(fi?.reason ?? ""), severity: (["low","medium","high"].includes(fi?.severity as string) ? fi.severity : "medium") as "low"|"medium"|"high", url: String(fi?.url ?? ""), date: fi?.date ? String(fi.date) : undefined };
              }) : [],
            };
          });
        }
        setReport(r);
      } catch (e) { setError(e instanceof Error ? e.message : "Error loading report"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
      <svg style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !report) return (
    <div style={{ maxWidth: 360, margin: "4rem auto", textAlign: "center" }}>
      <p style={{ color: "#f87171", marginBottom: "1rem", fontSize: "0.875rem" }}>{error || "Report not found."}</p>
      <Link href="/" className="btn btn-ghost">← Home</Link>
    </div>
  );

  const pct = Math.round(report.toxicityScore * 100);
  const riskColor = report.toxicityScore < 0.3 ? "#4ade80" : report.toxicityScore < 0.6 ? "#fbbf24" : "#f87171";
  const riskLabel = report.toxicityScore < 0.3 ? "Low risk" : report.toxicityScore < 0.6 ? "Moderate risk" : "High risk";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Back */}
      <Link href="/" className="btn btn-ghost" style={{ padding: "0.3rem 0.625rem", fontSize: "0.8rem", marginBottom: "1.5rem", display: "inline-flex" }}>
        ← Home
      </Link>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em" }}>{report.name}</h1>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.25rem" }}>
            {new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button onClick={() => window.print()} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>Print</button>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        {report.summaries.map((s, i) => (
          <p key={i} style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.7, margin: i > 0 ? "0.75rem 0 0" : 0 }}>{s}</p>
        ))}
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Risk level</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: riskColor, fontFamily: "var(--font-geist-mono), monospace" }}>
              {riskLabel} · {pct}%
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: riskColor, borderRadius: 99, transition: "width 0.6s ease" }} />
          </div>
        </div>
      </div>

      {/* Categories */}
      {report.categories.length > 0 && (
        <div className="card" style={{ overflow: "hidden", marginBottom: "1rem" }}>
          <div style={{ padding: "0.625rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Categories
            </span>
          </div>
          {report.categories.map((cat) => <CategoryRow key={cat.name} cat={cat} />)}
        </div>
      )}

      {/* Quotes */}
      {report.quotes.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "0.625rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Source quotes
            </span>
          </div>
          {report.quotes.slice(0, 10).map((q, i) => (
            <div key={i} style={{ padding: "1rem 1.25rem", borderBottom: i < 9 ? "1px solid var(--border)" : "none" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", fontStyle: "italic", margin: "0 0 0.5rem" }}>&ldquo;{q.content}&rdquo;</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-3)" }}>
                <span>{new Date(q.date).toLocaleDateString()}</span>
                {q.url && <a href={q.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-hi)" }}>Source ↗</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link href="/" className="btn btn-primary">← New analysis</Link>
      </div>
    </div>
  );
}
