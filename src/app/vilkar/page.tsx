import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brukervilkår — Sportsbytte",
  description:
    "Brukervilkår for Sportsbytte. Les om dine rettigheter og plikter som kjøper og selger på plattformen.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="max-w-2xl mb-12">
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
          Juridisk
        </span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink">
          Brukervilkår
        </h1>
        <p className="mt-3 text-ink-mid leading-relaxed">
          Disse vilkårene gjelder for alle som bruker Sportsbytte — enten du
          selger, kjøper eller bare kikker. Sist oppdatert{" "}
          <time dateTime="2026-04-17">17. april 2026</time>.
        </p>
      </div>

      <div className="space-y-5">
        {/* 1 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            1
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Om tjenesten
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Sportsbytte er en digital markedsplass for kjøp og salg av brukt
            sportsutstyr mellom privatpersoner, organisert rundt norske
            idrettsklubber. Tjenesten drives av Sportsbytte (under
            etablering), med adresse i Bergen, Norge.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Plattformen lar klubber opprette egne sider der medlemmene kan
            legge ut og kjøpe utstyr. Sportsbytte er en formidler —
            selve kjøpsavtalen inngås direkte mellom kjøper og selger.
          </p>
        </div>

        {/* 2 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            2
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Brukerkonto og ansvar
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Innlogging og brukerkontoer er under utvikling og vil lanseres
            snart. Når kontofunksjonaliteten er aktiv, gjelder følgende:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Du må være minst 18 år for å opprette konto og gjennomføre
              transaksjoner selvstendig.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Du er ansvarlig for at informasjonen på kontoen din er korrekt
              og oppdatert.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Hold passordet ditt hemmelig. Du er ansvarlig for aktivitet som
              skjer via din konto.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Mistenkelig aktivitet skal rapporteres til oss umiddelbart via{" "}
              <a
                href="mailto:hei@sportsbytte.no"
                className="text-forest underline underline-offset-2 hover:text-forest-mid transition-colors duration-[120ms]"
              >
                hei@sportsbytte.no
              </a>
              .
            </li>
          </ul>
        </div>

        {/* 3 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            3
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Annonser og salg
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Som selger på Sportsbytte er du selv ansvarlig for innholdet du
            publiserer. Sportsbytte tar et tjenestegebyr på gjennomførte
            salg — gebyret trekkes automatisk fra utbetalingen til selger.
            Det er gratis å opprette annonser.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Annonser må være nøyaktige. Beskriv tilstand, alder og eventuelle
              feil ærlig.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Bilder skal vise det faktiske produktet — ikke bilder fra
              nettbutikker eller andre kilder.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Bilder og tekst du laster opp forblir din eiendom, men du gir
              Sportsbytte rett til å vise dem på plattformen.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Sportsbytte forbeholder seg retten til å fjerne annonser
              uten varsel dersom de bryter vilkårene.
            </li>
          </ul>
        </div>

        {/* 4 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            4
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Betaling og frakt
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Betaling på Sportsbytte skjer via{" "}
            <strong className="text-ink">Stripe</strong>. Beløpet holdes av
            plattformen til kjøper bekrefter mottak og er fornøyd — først da
            utbetales pengene til selger.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Frakt håndteres via{" "}
            <strong className="text-ink">Bring</strong>. Selger genererer
            fraktlabel direkte gjennom plattformen. Selger er ansvarlig for
            å pakke varen forsvarlig. Ved skade under transport gjelder
            Brings egne transportvilkår.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Kjøper betaler fraktkostnaden, som legges til i kassen.
            Selger kan også tilby henting dersom begge parter er enige.
          </p>
        </div>

        {/* 5 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            5
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Kjøperbeskyttelse
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Alle transaksjoner gjennomført via Sportsbytte er dekket av
            kjøperbeskyttelse. Dersom varen ikke er som beskrevet i annonsen,
            kan kjøper åpne en sak innen{" "}
            <strong className="text-ink">48 timer</strong> etter mottak.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Sportsbytte vil da megle mellom kjøper og selger. Mulige utfall
            er full refusjon, delvis refusjon eller at salget fastholdes.
            Beslutningen er endelig. Pengene holdes tilbake inntil saken er
            løst.
          </p>
        </div>

        {/* 6 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            6
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Forbudt innhold
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Følgende er ikke tillatt på Sportsbytte:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            {[
              "Våpen, ammunition eller farlige gjenstander",
              "Ulovlige produkter eller produkter som selges ulovlig",
              "Forfalsket utstyr eller etterligninger av merkevarer",
              "Annonser med villedende eller bevisst feil informasjon",
              "Innhold som er rasistisk, hatefullt eller krenkende",
              "Salg på vegne av andre uten eksplisitt tillatelse",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <svg className="h-4 w-4 text-amber flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-mid">
            Brudd på dette kan føre til umiddelbar utestengelse fra
            plattformen.
          </p>
        </div>

        {/* 7 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            7
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Ansvarsbegrensning
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Sportsbytte er en formidlingstjeneste. Vi er ikke part i
            kjøpsavtalen mellom kjøper og selger, og vi er ikke ansvarlige
            for kvaliteten på varer som selges, for forsinkelser i frakt
            eller for tvister som oppstår utenfor plattformens
            kjøperbeskyttelse.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Vi gjør vårt beste for å holde plattformen tilgjengelig og
            trygg, men kan ikke garantere feilfri drift til enhver tid.
            Vi er ikke ansvarlige for tap som følge av nedetid eller
            tekniske feil.
          </p>
        </div>

        {/* 8 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            8
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Kontakt
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Spørsmål om brukervilkårene? Vi svarer gjerne.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:vilkar@sportsbytte.no"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink hover:border-forest hover:text-forest transition-colors duration-[120ms]"
            >
              vilkar@sportsbytte.no
            </a>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink hover:border-forest hover:text-forest transition-colors duration-[120ms]"
            >
              Kontaktskjema →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
