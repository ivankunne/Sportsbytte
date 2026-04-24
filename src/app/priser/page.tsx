import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priser",
  description: "Se prisene for Sportsbytte — gratis å annonsere, 8 % transaksjonsgebyr ved salg. Klubbplan fra 199 kr/mnd.",
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
          Gratis å annonsere. Du betaler kun når du selger — og klubber kan
          velge en fast månedspris for premium-funksjoner.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free - Individual */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <h3 className="font-display text-lg font-semibold text-ink">Selger</h3>
          <p className="text-sm text-ink-light mt-1">For privatpersoner</p>
          <div className="mt-5">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold font-display text-ink">0 kr</span>
            </div>
            <p className="text-xs text-ink-light mt-1">å annonsere · gratis å opprette konto</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-light px-3 py-1.5">
              <span className="text-sm font-bold text-amber">8 %</span>
              <span className="text-xs text-ink-mid">transaksjonsgebyr ved salg</span>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              "Ubegrenset antall annonser",
              "Opptil 8 bilder per annonse",
              "Meldinger med kjøpere",
              "Kortbetaling",
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

        {/* Club Basic */}
        <div className="bg-white rounded-2xl p-7 shadow-md border-2 border-forest relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-forest px-4 py-1 text-xs font-bold text-white">
              Mest populær
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink">Klubb Basis</h3>
          <p className="text-sm text-ink-light mt-1">For idrettslag og klubber</p>
          <div className="mt-5">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold font-display text-ink">199 kr</span>
              <span className="text-sm text-ink-light">/mnd</span>
            </div>
            <p className="text-xs text-ink-light mt-1">+ 5 % transaksjonsgebyr ved salg</p>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              "Alt i Selger-planen",
              "Egen klubbside med logo og farger",
              "Klubbfiltrert annonsevisning",
              "Digitalt byttemarked for klubben",
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
            Registrer klubben
          </Link>
          <p className="mt-2 text-center text-xs text-ink-light">Gratis i åpningsperioden · ingen binding</p>
        </div>

        {/* Club Pro */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <h3 className="font-display text-lg font-semibold text-ink">Klubb Pro</h3>
          <p className="text-sm text-ink-light mt-1">For større klubber</p>
          <div className="mt-5">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold font-display text-ink">499 kr</span>
              <span className="text-sm text-ink-light">/mnd</span>
            </div>
            <p className="text-xs text-ink-light mt-1">+ 3 % transaksjonsgebyr ved salg</p>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              "Alt i Klubb Basis",
              "Prioritert synlighet i søk",
              "CSV-import av medlemmer",
              "Avansert statistikk og rapporter",
              "Tilpasset velkomst-e-post",
              "Dedikert støtte",
              "API-tilgang (kommer)",
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
            href="/kontakt"
            className="mt-8 block w-full rounded-lg border-2 border-forest py-2.5 text-center text-sm font-semibold text-forest hover:bg-forest hover:text-white transition-colors duration-[120ms]"
          >
            Ta kontakt
          </Link>
        </div>
      </div>

      {/* Transaction fee explainer */}
      <div className="mt-10 rounded-2xl bg-cream border border-border p-6 max-w-3xl mx-auto">
        <h3 className="font-display text-base font-semibold text-ink mb-2">Om transaksjonsgebyret</h3>
        <p className="text-sm text-ink-mid">
          Transaksjonsgebyret beregnes av salgsprisen og trekkes automatisk ved gjennomført salg.
          Gebyret dekker betalingsbehandling, kjøperbeskyttelse og plattformdrift.
          Ingen skjulte avgifter — du ser alltid gebyret før du bekrefter salget.
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
              a: "Det er gratis å opprette konto og lage annonser. Vi tar 8 % av salgsprisen ved gjennomført salg.",
            },
            {
              q: "Hva koster klubbplanen?",
              a: "Klubb Basis koster 199 kr/mnd med 5 % transaksjonsgebyr. Klubb Pro koster 499 kr/mnd med 3 % transaksjonsgebyr. I åpningsperioden er det gratis.",
            },
            {
              q: "Hva dekker transaksjonsgebyret?",
              a: "Gebyret dekker kortbetaling via Stripe, kjøperbeskyttelse, kundeservice og plattformdrift.",
            },
            {
              q: "Kan vi bytte plan underveis?",
              a: "Ja, du kan oppgradere eller nedgradere når som helst. Endringen trer i kraft fra neste måned.",
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
  );
}
