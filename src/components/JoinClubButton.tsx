"use client";

import { useState } from "react";
import { contrastColor } from "@/lib/color";

type Props = {
  clubId: number;
  clubName: string;
  isMembershipGated: boolean;
  memberEmailDomain?: string | null;
  accentColor?: string | null;
};

export function JoinClubButton({ clubId, clubName, isMembershipGated, memberEmailDomain, accentColor }: Props) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");

  const normalizedDomain = memberEmailDomain?.replace(/^@/, "").toLowerCase();
  const [approvedStatus, setApprovedStatus] = useState<"pending" | "approved" | null>(null);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Skriv inn ditt navn");
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/join-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, name: form.name, email: form.email || undefined, message: form.message || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Noe gikk galt");
      setApprovedStatus(json.status);
      setSubmitted(true);
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    if (approvedStatus === "approved") {
      return (
        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Velkommen som medlem!
        </div>
      );
    }
    return (
      <div className="rounded-lg bg-white/15 border border-white/30 px-5 py-3 max-w-xs text-left backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1">
          <svg className="h-4 w-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-white">Søknad sendt!</span>
        </div>
        <p className="text-xs text-white/80 leading-snug">
          En klubbadmin vil godkjenne forespørselen din. Du får beskjed på e-post når du er godkjent.
        </p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-5 py-2 text-sm font-semibold hover:brightness-92 transition-all duration-[120ms]"
        style={{
          backgroundColor: accentColor || "#e8843a",
          color: contrastColor(accentColor || "#e8843a"),
        }}
      >
        {isMembershipGated ? "Søk om medlemskap" : "Bli med i klubben"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="font-display text-xl font-bold text-ink">
              Bli med i {clubName}
            </h2>
            <p className="mt-1 text-sm text-ink-light mb-6">
              {isMembershipGated
                ? "Fyll ut skjemaet — en admin godkjenner forespørselen din."
                : "Send en forespørsel til klubben."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Ditt navn</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Fullt navn"
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>
              {normalizedDomain && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    E-post{" "}
                    <span className="text-ink-light font-normal">(automatisk godkjenning med @{normalizedDomain})</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={`navn@${normalizedDomain}`}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Melding til admin (valgfritt)
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Kort intro om deg selv..."
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50"
                >
                  {submitting ? "Sender..." : "Send forespørsel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
