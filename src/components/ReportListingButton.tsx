"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/components/Toaster";

const REASONS = [
  { value: "scam",           label: "Svindel / falsk annonse" },
  { value: "wrong_category", label: "Feil kategori" },
  { value: "inappropriate",  label: "Upassende innhold" },
  { value: "already_sold",   label: "Allerede solgt" },
  { value: "other",          label: "Annet" },
];

export function ReportListingButton({ listingId }: { listingId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/report-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ listing_id: listingId, reason, description }),
      });
      if (!res.ok) throw new Error();
      showSuccess("Rapport sendt. Takk for at du hjelper til!");
      setOpen(false);
      setReason("");
      setDescription("");
    } catch {
      showError("Noe gikk galt. Prøv igjen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-ink-light hover:text-red-500 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17.25 4.5 21V8.742m.164-4.078a2.15 2.15 0 011.743-1.342 48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185V19.5M4.664 4.664L19.5 19.5" />
        </svg>
        Rapporter annonse
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink">Rapporter annonse</h3>
              <button onClick={() => setOpen(false)} className="text-ink-light hover:text-ink">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {REASONS.map((r) => (
                <label key={r.value} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${reason === r.value ? "border-red-400 bg-red-50" : "border-border hover:bg-cream"}`}>
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-red-500"
                  />
                  <span className="text-sm text-ink">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tilleggsinformasjon (valgfritt)..."
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-ink-mid hover:bg-cream transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sender..." : "Send rapport"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
