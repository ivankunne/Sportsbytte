"use client";

import { useState } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Wire to email service (Resend, SendGrid, etc.)
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-3">✉️</div>
        <h3 className="font-display text-xl font-semibold text-ink">Takk for meldingen!</h3>
        <p className="mt-2 text-sm text-ink-light">
          Vi svarer vanligvis innen 24 timer på hverdager.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
        >
          Send en ny melding
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">Navn *</label>
          <input id="name" type="text" required className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">E-post *</label>
          <input id="email" type="email" required placeholder="din@epost.no" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-ink mb-1.5">Emne</label>
        <select id="subject" className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest">
          <option value="">Velg emne</option>
          <option>Generelt spørsmål</option>
          <option>Klubbregistrering</option>
          <option>Teknisk problem</option>
          <option>Samarbeid / Partnerskap</option>
          <option>Presse</option>
          <option>Annet</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink mb-1.5">Melding *</label>
        <textarea
          id="message"
          rows={5}
          required
          placeholder="Fortell oss hva vi kan hjelpe med..."
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-forest py-3 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
      >
        Send melding
      </button>
    </form>
  );
}
