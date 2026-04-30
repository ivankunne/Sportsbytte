import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priser",
  description: "Se prisene for Sportsbytte — gratis å annonsere. Kjøpere betaler 5 % servicegebyr ved kjøp. Pro-plan for selgere og klubber reduserer gebyret til 2 %.",
  openGraph: {
    title: "Priser — Sportsbytte",
    description: "Gratis å annonsere. 5 % servicegebyr per salg. Pro-plan med 2 % for aktive selgere og klubber.",
    url: "https://sportsbytte.no/priser",
    siteName: "Sportsbytte",
    locale: "nb_NO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Priser — Sportsbytte",
    description: "Gratis å annonsere. 5 % servicegebyr per salg. Pro-plan med 2 % for aktive selgere og klubber.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Hva koster det å selge som privatperson?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Det er gratis å opprette konto og lage annonser. Kjøpere betaler 5 % servicegebyr på toppen av listeprisen. Som Selger Pro betaler kjøperne dine kun 2 %.",
      },
    },
    {
      "@type": "Question",
      name: "Hva er Selger Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Selger Pro er en abonnementsplan for aktive selgere til 99 kr/mnd. Kjøperne dine betaler kun 2 % servicegebyr (mot 5 % standard), du kan fremheve annonser øverst i søk, og får et Pro-badge på profilen din.",
      },
    },
    {
      "@type": "Question",
      name: "Hva koster Pro-planen for klubber?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Klubb Pro koster 499 kr/mnd — kjøpere på klubbens annonser betaler kun 2 % servicegebyr. Klubb Basis er gratis i åpningsperioden med 5 % servicegebyr for kjøpere.",
      },
    },
    {
      "@type": "Question",
      name: "Hva dekker transaksjonsgebyret?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gebyret dekker kortbetaling via Stripe, kjøperbeskyttelse, kundeservice og plattformdrift.",
      },
    },
    {
      "@type": "Question",
      name: "Kan jeg bytte plan underveis?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, du kan oppgradere eller avslutte abonnementet når som helst direkte fra profilsiden i dashbordet ditt.",
      },
    },
  ],
};

function Check({ gold = false }: { gold?: boolean }) {
  return (
    <svg
      className={`h-5 w-5 flex-shrink-0 ${gold ? "text-amber" : "text-forest"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-14">
        <span className="text-xs font-bold text-amber uppercase tracking-wider">
          Priser
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
          Enkle, rettferdige priser
        </h1>
        <p className="mt-3 text-ink-mid max-w-lg mx-auto">
          Gratis å annonsere. Kjøpere betaler et lite servicegebyr ved kjøp — selgere mottar alltid fullt listebeløp.
          Oppgrader til Pro for å gi kjøperne dine lavere gebyr.
        </p>
      </div>

      {/* ── For selgere ─────────────────────────────────── */}
      <h2 className="font-display text-lg font-semibold text-ink mb-4">For selgere</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

        {/* Selger — Free */}
        <div className="bg-white rounded-2xl p-7 border border-border flex flex-col">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Selger</h3>
            <p className="text-sm text-ink-light mt-1">For alle privatpersoner</p>
            <div className="mt-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-display text-ink">0 kr</span>
              </div>
              <p className="text-xs text-ink-light mt-1">å annonsere · gratis å opprette konto</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-light px-3 py-1.5">
                <span className="text-sm font-bold text-amber">5 %</span>
                <span className="text-xs text-ink-mid">servicegebyr betalt av kjøper</span>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Ubegrenset antall annonser",
                "Opptil 8 bilder per annonse",
                "Meldinger med kjøpere",
                "Kortbetaling via Stripe",
                "Henting eller sending — avtal med kjøper",
                "Kjøperbeskyttelse",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-light">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/selg"
            className="mt-8 block w-full rounded-lg border-2 border-forest py-2.5 text-center text-sm font-semibold text-forest hover:bg-forest hover:text-white transition-colors duration-[120ms]"
          >
            Start å selge
          </Link>
        </div>

        {/* Selger Pro */}
        <div className="bg-white rounded-2xl p-7 border-2 border-amber/50 relative flex flex-col">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-amber px-4 py-1 text-xs font-bold text-white">
              Pro
            </span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Selger Pro</h3>
            <p className="text-sm text-ink-light mt-1">For aktive selgere</p>
            <div className="mt-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-display text-ink">99 kr</span>
                <span className="text-sm text-ink-light">/mnd</span>
              </div>
              <p className="text-xs text-ink-light mt-1">avbryt når som helst</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-light px-3 py-1.5">
                <span className="text-sm font-bold text-amber">2 %</span>
                <span className="text-xs text-ink-mid">servicegebyr betalt av kjøper</span>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Alt i Selger-planen",
                "Kjøpere betaler kun 2 % servicegebyr (vs. 5 %)",
                "Fremhev annonser øverst i søk",
                "Pro-badge på profilen din",
                "Prioritert kundeservice",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-light">
                  <Check gold />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/dashboard?tab=profil"
            className="mt-8 block w-full rounded-lg bg-amber py-2.5 text-center text-sm font-semibold text-white hover:brightness-95 transition-all duration-[120ms]"
          >
            Bli Pro-selger
          </Link>
          <p className="mt-2 text-center text-xs text-ink-light">
            Oppgrader fra din profilside
          </p>
        </div>
      </div>

      {/* ── For klubber ─────────────────────────────────── */}
      <h2 className="font-display text-lg font-semibold text-ink mb-4">For klubber</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Klubb Basis */}
        <div className="bg-white rounded-2xl p-7 shadow-md border-2 border-forest relative flex flex-col">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-forest px-4 py-1 text-xs font-bold text-white">
              Mest populær
            </span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Klubb Basis</h3>
            <p className="text-sm text-ink-light mt-1">For idrettslag og klubber</p>
            <div className="mt-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-display text-ink">Gratis</span>
              </div>
              <p className="text-xs text-ink-light mt-1">i åpningsperioden · ingen binding</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-light px-3 py-1.5">
                <span className="text-sm font-bold text-amber">5 %</span>
                <span className="text-xs text-ink-mid">servicegebyr betalt av kjøper</span>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Alt i Selger-planen",
                "Egen klubbside med logo og farger",
                "Klubbfiltrert annonsevisning",
                "Digitalt byttemarked for klubben",
                "Inviter medlemmer via lenke + QR",
                "CSV-import (maks 20 per gang)",
                "Analysetavle for klubbadmin",
                "E-postsupport",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-light">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/registrer-klubb"
            className="mt-8 block w-full rounded-lg bg-forest py-2.5 text-center text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
          >
            Registrer klubben
          </Link>
        </div>

        {/* Klubb Pro */}
        <div className="bg-white rounded-2xl p-7 border-2 border-amber/40 relative flex flex-col">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-amber px-4 py-1 text-xs font-bold text-white">
              Pro
            </span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Klubb Pro</h3>
            <p className="text-sm text-ink-light mt-1">For større og aktive klubber</p>
            <div className="mt-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-display text-ink">499 kr</span>
                <span className="text-sm text-ink-light">/mnd</span>
              </div>
              <p className="text-xs text-ink-light mt-1">faktureres månedlig</p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-light px-3 py-1.5">
                <span className="text-sm font-bold text-amber">2 %</span>
                <span className="text-xs text-ink-mid">servicegebyr betalt av kjøper</span>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                "Alt i Klubb Basis",
                "Kjøpere betaler kun 2 % servicegebyr (vs. 5 %)",
                "Prioritert synlighet på /klubber",
                "Pro-merke på klubbsiden",
                "Ubegrenset CSV-import av medlemmer",
                "Utvidet analysetavle",
                "Brandede invitasjonssider",
                "Dedikert støtte",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-light">
                  <Check gold />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/registrer-klubb?pro=1"
            className="mt-8 block w-full rounded-lg bg-amber py-2.5 text-center text-sm font-semibold text-white hover:brightness-95 transition-all duration-[120ms]"
          >
            Oppgrader klubben
          </Link>
          <p className="mt-2 text-center text-xs text-ink-light">
            Logg inn på klubbens adminpanel for å oppgradere
          </p>
        </div>
      </div>

      {/* Transaction fee explainer */}
      <div className="mt-10 rounded-2xl bg-cream border border-border p-6 max-w-3xl mx-auto">
        <h3 className="font-display text-base font-semibold text-ink mb-2">Om transaksjonsgebyret</h3>
        <p className="text-sm text-ink-mid">
          Servicegebyret betales av kjøperen og legges på toppen av listeprisen ved utsjekk — selgeren mottar alltid det fulle beløpet som er annonsert.
          Gebyret dekker betalingsbehandling via Stripe, kjøperbeskyttelse og plattformdrift.
          Ingen skjulte avgifter — kjøper ser alltid gebyret og totalpris tydelig før de bekrefter kjøpet.
        </p>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-semibold text-ink text-center mb-8">
          Ofte stilte spørsmål
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Hva koster det å selge som privatperson?",
              a: "Det er gratis å opprette konto og lage annonser. Kjøpere betaler 5 % servicegebyr på toppen av listeprisen. Som Selger Pro betaler kjøperne dine kun 2 %.",
            },
            {
              q: "Hva er Selger Pro?",
              a: "Selger Pro er en abonnementsplan for aktive selgere til 99 kr/mnd. Kjøperne dine betaler kun 2 % servicegebyr (mot 5 % standard), du kan fremheve annonser øverst i søk, og får et Pro-badge på profilen din.",
            },
            {
              q: "Hva koster Pro-planen for klubber?",
              a: "Klubb Pro koster 499 kr/mnd — kjøpere på klubbens annonser betaler kun 2 % servicegebyr. Klubb Basis er gratis i åpningsperioden med 5 % servicegebyr for kjøpere.",
            },
            {
              q: "Hva dekker transaksjonsgebyret?",
              a: "Gebyret dekker kortbetaling via Stripe, kjøperbeskyttelse, kundeservice og plattformdrift.",
            },
            {
              q: "Kan jeg bytte plan underveis?",
              a: "Ja, du kan oppgradere eller avslutte abonnementet når som helst direkte fra profilsiden i dashbordet ditt.",
            },
          ].map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl p-5 border border-border">
              <h3 className="font-medium text-ink text-sm">{faq.q}</h3>
              <p className="mt-2 text-sm text-ink-mid">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
