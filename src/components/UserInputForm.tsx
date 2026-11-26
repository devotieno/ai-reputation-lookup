import React, { useState, useCallback, useEffect, memo, useMemo } from "react";

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

type Field = {
  key: keyof Pick<UserInput, "twitter" | "linkedin" | "github" | "reddit" | "youtube" | "instagram">;
  label: string;
  placeholder: string;
  prefix?: string;
};

const FIELDS: Field[] = [
  { key: "twitter",   label: "X / Twitter", placeholder: "username",          prefix: "@" },
  { key: "linkedin",  label: "LinkedIn",     placeholder: "in/username" },
  { key: "github",    label: "GitHub",       placeholder: "username" },
  { key: "reddit",    label: "Reddit",       placeholder: "username",          prefix: "u/" },
  { key: "youtube",   label: "YouTube",      placeholder: "channel or @handle" },
  { key: "instagram", label: "Instagram",    placeholder: "username",          prefix: "@" },
];

const PlatformInput = memo(function PlatformInput({
  field,
  value,
  onChange,
  connected,
}: {
  field: Field;
  value: string;
  onChange: (key: string, val: string) => void;
  connected: boolean;
}) {
  const filled = value.trim().length > 0;
  return (
    <div>
      <label
        htmlFor={field.key}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "var(--text-2)",
          marginBottom: "0.375rem",
        }}
      >
        <span>{field.label}</span>
        {connected && <span className="badge badge-green" style={{ padding: "0.1rem 0.5rem", fontSize: "0.65rem" }}>Connected</span>}
      </label>
      <div style={{ position: "relative" }}>
        {field.prefix && (
          <span
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.8125rem",
              color: "var(--text-3)",
              pointerEvents: "none",
              fontFamily: "var(--font-geist-mono), monospace",
            }}
          >
            {field.prefix}
          </span>
        )}
        <input
          id={field.key}
          className="input"
          type="text"
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          style={{
            paddingLeft: field.prefix ? "2rem" : "0.75rem",
            fontFamily: filled ? "var(--font-geist-mono), monospace" : undefined,
            fontSize: "0.8125rem",
            borderColor: filled ? "rgba(139,92,246,0.35)" : undefined,
          }}
        />
      </div>
    </div>
  );
});

const UserInputForm = memo(function UserInputForm({
  onSubmit,
  disabled = false,
  connectedAccounts = [],
}: {
  onSubmit: (data: UserInput) => void;
  disabled?: boolean;
  isAuthenticated?: boolean;
  connectedAccounts?: string[];
}) {
  const [form, setForm] = useState<UserInput>({ name: "", photo: null });
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleField = useCallback((key: string, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setForm((p) => ({ ...p, photo: file }));
    setFileName(file.name);
  }, []);

  const clearFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    setForm((p) => ({ ...p, photo: null }));
  }, [preview]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    onSubmit(form);
  }, [disabled, form, onSubmit]);

  const filledCount = useMemo(() =>
    FIELDS.filter((f) => Boolean((form[f.key] as string)?.trim())).length,
    [form]);

  const canSubmit = form.name.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ overflow: "hidden" }}>

        {/* ── Name + Email ─────────────────────────────── */}
        <div style={{ padding: "1.5rem 1.5rem 0" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Subject
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-2)", marginBottom: "0.375rem" }}>
                Full name <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <input
                id="name"
                className="input"
                type="text"
                required
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="e.g. Jane Doe"
                style={{ fontSize: "0.9375rem", fontWeight: 500 }}
              />
            </div>
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-2)", marginBottom: "0.375rem" }}>
                Email <span style={{ color: "var(--text-3)", fontWeight: 400 }}>optional</span>
              </label>
              <input
                id="email"
                className="input"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => handleField("email", e.target.value)}
                placeholder="jane@example.com"
                style={{ fontSize: "0.8125rem" }}
              />
            </div>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div style={{ margin: "1.25rem 0", borderTop: "1px solid var(--border)" }} />

        {/* ── Platform handles ─────────────────────────── */}
        <div style={{ padding: "0 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Social profiles
            </p>
            {filledCount > 0 && (
              <span className="badge badge-accent">
                {filledCount} added
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FIELDS.map((f) => (
              <PlatformInput
                key={f.key}
                field={f}
                value={(form[f.key] as string) ?? ""}
                onChange={handleField}
                connected={connectedAccounts.includes(f.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div style={{ margin: "1.25rem 0", borderTop: "1px solid var(--border)" }} />

        {/* ── Photo + submit ───────────────────────────── */}
        <div style={{ padding: "0 1.5rem 1.5rem", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "1rem" }}>
          {/* Photo upload */}
          <div style={{ flex: "1 1 220px" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Photo <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>optional</span>
            </p>
            {!preview ? (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed var(--border-mid)",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  color: "var(--text-2)",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLLabelElement).style.color = "var(--text-1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border-mid)";
                  (e.currentTarget as HTMLLabelElement).style.color = "var(--text-2)";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                Upload photo
                <input name="photo" type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
              </label>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.05)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
                <button type="button" onClick={clearFile} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", lineHeight: 1, padding: "0.125rem", fontSize: "1rem" }} aria-label="Remove photo">×</button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ flex: "1 1 220px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit}
              style={{ padding: "0.6875rem 1.5rem", fontSize: "0.9375rem", width: "100%" }}
            >
              {disabled ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Analysing…
                </>
              ) : "Analyse reputation →"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
});

export default UserInputForm;
