"use client";

import { useState } from "react";
import { createSavedSearch } from "@/lib/queries";
import type { Category, Club } from "@/lib/queries";

type Props = {
  clubs?: Club[];
  categories?: Category[];
  defaultKeywords?: string;
  defaultCategory?: string;
  defaultClubId?: number;
};

export function SavedSearchAlert({
  clubs = [],
  categories = [],
  defaultKeywords = "",
  defaultCategory = "",
  defaultClubId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    keywords: defaultKeywords,
    category: defaultCategory,
    maxPrice: "",
    sizeHint: "",
    clubId: defaultClubId ?? "",
  });

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSubmitting(true);
    try {
      const id = await createSavedSearch({
        notifyEmail: form.email.trim(),
        keywords: form.keywords.trim() || undefined,
        category: form.category || undefined,
        maxPrice: form.maxPrice ? parseInt(form.maxPrice) : undefined,
        sizeHint: form.sizeHint.trim() || undefined,
        clubId: form.clubId ? Number(form.clubId) : undefined,
      });
      setSavedId(id);
      setSaved(true);
      setOpen(false);
    } catch {
      // silent fail — user can retry
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!savedId) return;
    setDeleting(true);
    await fetch(`/api/saved-searches?id=${savedId}&email=${encodeURIComponent(form.email)}`, { method: "DELETE" }).catch(() => {});
    setSaved(false);
    setSavedId(null);
    setDeleting(false);
  }

  if (saved) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-forest-light border border-forest/20 px-5 py-4">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-forest flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-forest font-medium">
            Varsel lagret! Vi gir deg beskjed når noe matcher søket ditt.
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-forest/60 hover:text-forest transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {deleting ? "Sletter..." : "Slett varsel"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-ink hover:border-forest/30 hover:bg-forest-light/50 transition-all duration-[120ms]"
        >
          <svg className="h-4 w-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          Lagre søk og få varsel
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-white p-6 space-y-4"
        >
          <div>
            <h4 className="font-display text-base font-semibold text-ink">Lagre søket som varsel</h4>
            <p className="text-xs text-ink-light mt-0.5">
              Vi sender deg e-post når nytt utstyr matcher søket ditt.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">E-postadresse</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="din@epost.no"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Søkeord</label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="F.eks. slalom ski"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="">Alle kategorier</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.name}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Maks pris (kr)</label>
              <input
                type="number"
                value={form.maxPrice}
                onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                placeholder="F.eks. 1500"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Størrelse</label>
              <input
                type="text"
                value={form.sizeHint}
                onChange={(e) => setForm({ ...form, sizeHint: e.target.value })}
                placeholder="F.eks. 180 cm eller str L"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              />
            </div>
          </div>

          {clubs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Kun fra klubb (valgfritt)</label>
              <select
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
              >
                <option value="">Alle klubber</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

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
              {submitting ? "Lagrer..." : "Lagre varsel"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
