import Link from "next/link";
import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Kontakt Sportsbytte",
  url: "https://sportsbytte.no/kontakt",
  description: "Ta kontakt med Sportsbytte for spørsmål om klubbregistrering, samarbeid eller teknisk hjelp.",
  mainEntity: {
    "@type": "ContactPoint",
    email: "hei@sportsbytte.no",
    contactType: "customer support",
    areaServed: "NO",
    availableLanguage: "Norwegian",
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
  },
};

export const metadata: Metadata = {
  title: "Kontakt oss",
  description: "Ta kontakt med Sportsbytte for spørsmål om klubbregistrering, samarbeid eller teknisk hjelp.",
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
          Kontakt oss
        </h1>
        <p className="mt-3 text-ink-mid max-w-lg mx-auto">
          Har du spørsmål om Sportsbytte, klubbregistrering eller samarbeid?
          Vi svarer vanligvis innen 24 timer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Contact form */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 sm:p-8 border border-border">
          <h2 className="font-display text-xl font-semibold text-ink mb-6">
            Send oss en melding
          </h2>
          <ContactForm />
        </div>

        {/* Contact info sidebar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-border">
            <h3 className="font-display text-lg font-semibold text-ink mb-4">
              Kontaktinfo
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-forest mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-ink">E-post</p>
                  <p className="text-sm text-ink-light">hei@sportsbytte.no</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-forest mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-ink">Adresse</p>
                  <p className="text-sm text-ink-light">Bergen, Norge</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-forest-light rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-ink mb-2">
              For klubber
            </h3>
            <p className="text-sm text-ink-mid mb-4">
              Vil du registrere klubben din? Vi hjelper deg med oppsett og
              lansering.
            </p>
            <Link
              href="/registrer-klubb"
              className="text-sm font-semibold text-forest hover:text-forest-mid transition-colors duration-[120ms]"
            >
              Registrer klubb →
            </Link>
          </div>

          <div className="bg-amber-light rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold text-ink mb-2">
              Responstid
            </h3>
            <p className="text-sm text-ink-mid">
              Vi svarer vanligvis innen <strong>24 timer</strong> på
              hverdager.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
