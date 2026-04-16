"use client";

import { useState } from "react";
import { createMembershipRequest } from "@/lib/queries";

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

  function resolveStatus(): "pending" | "approved" {
    if (!normalizedDomain) return "pending";
    return form.email.toLowerCase().endsWith(`@${normalizedDomain}`) ? "approved" : "pending";
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Skriv inn ditt navn");
    setSubmitting(true);
    setError("");
    try {
      await createMembershipRequest(clubId, form.name, form.message || undefined, resolveStatus());
      setSubmitted(true);
      setOpen(false);
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-white/20 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm">
        {resolveStatus() === "approved" ? "Velkommen! ✓" : "Søknad sendt ✓"}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-5 py-2 text-sm font-semibold text-white hover:brightness-92 transition-all duration-[120ms]"
        style={{ backgroundColor: accentColor || "#e8843a" }}
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
