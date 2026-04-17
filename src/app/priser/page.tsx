import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priser",
  description: "Se prisene for Sportsbyttet — gratis for enkeltselgere, rimelige planer for klubber med avanserte funksjoner.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-14">
        <span className="text-xs font-bold text-amber uppercase tracking-wider">
          Priser
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
          Enkle, rettferdige priser
        </h1>
        <p className="mt-3 text-ink-mid max-w-lg mx-auto">
          Gratis for individuelle selgere. Klubber betaler kun for
          premium-funksjoner — og kan starte gratis.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free - Individual */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <h3 className="font-display text-lg font-semibold text-ink">Selger</h3>
          <p className="text-sm text-ink-light mt-1">For individuelle brukere</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-4xl font-bold font-display text-ink">Gratis</span>
          </div>
          <p className="mt-1 text-xs text-ink-light">8% transaksjonsgebyr ved salg</p>

          <ul className="mt-6 space-y-3">
            {[
              "Opprett ubegrenset annonser",
              "Opptil 8 bilder per annonse",
              "Meldinger med kjøpere",
              "Vipps-betaling",
              "Bring-fraktlabel",
              "Kjøperbeskyttelse",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-ink-light">
                <svg className="h-5 w-5 text-forest flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href="/selg"
            className="mt-8 block w-full rounded-lg border-2 border-forest py-2.5 text-center text-sm font-semibold text-forest hover:bg-forest hover:text-white transition-colors duration-[120ms]"
          >
            Start å selge
          </Link>
        </div>

        {/* Club - Standard */}
        <div className="bg-white rounded-2xl p-7 shadow-md border-2 border-forest relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-amber px-4 py-1 text-xs font-bold text-white">
              For klubber
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink">Klubb</h3>
          <p className="text-sm text-ink-light mt-1">For idrettslag og klubber</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-4xl font-bold font-display text-ink">Gratis</span>
          </div>
          <p className="mt-1 text-xs text-ink-light">Lav % transaksjonsgebyr kun ved gjennomført salg</p>

          <ul className="mt-6 space-y-3">
            {[
              "Alt i Selger-planen",
              "Egen klubbside med logo & farger",
              "Klubbfiltrert annonsevisning",
              "Digitale byttemarked",
              "Inviter medlemmer via lenke",
              "Grunnleggende statistikk",
              "E-postsupport",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-ink-light">
                <svg className="h-5 w-5 text-forest flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          <Link
            href="/registrer-klubb"
            className="mt-8 block w-full rounded-lg bg-forest py-2.5 text-center text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
          >
            Registrer klubben gratis
          </Link>
          <p className="mt-2 text-center text-xs text-ink-light">Ingen binding · Eksakt sats kunngjøres ved lansering</p>
        </div>

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
              a: "Det er helt gratis å opprette en konto og lage annonser. Vi tar 8% av salgsprisen når en vare selges.",
            },
            {
              q: "Kan klubben prøve gratis?",
              a: "Ja! Alle klubber får 30 dager gratis prøveperiode med full funksjonalitet. Ingen kredittkort nødvendig.",
            },
            {
              q: "Hva dekker transaksjonsgebyret?",
              a: "Gebyret dekker Vipps-betaling, kjøperbeskyttelse, kundeservice og plattformdrift.",
            },
            {
              q: "Kan vi bytte plan underveis?",
              a: "Ja, du kan oppgradere eller nedgradere når som helst. Endringen trer i kraft ved neste fakturering.",
            },
          ].map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl p-5">
              <h3 className="font-medium text-ink text-sm">{faq.q}</h3>
              <p className="mt-2 text-sm text-ink-mid">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
