import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salgsvilkår — Sportsbytte",
  description:
    "Salgsvilkår for Sportsbytte. Les om betaling, levering, angrerett, retur og klagebehandling.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="max-w-2xl mb-12">
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
          Juridisk
        </span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink">
          Salgsvilkår
        </h1>
        <p className="mt-3 text-ink-mid leading-relaxed">
          Disse vilkårene gjelder for alle kjøp og salg som gjennomføres via
          Sportsbytte. Sist oppdatert{" "}
          <time dateTime="2026-05-10">10. mai 2026</time>.
        </p>
      </div>

      <div className="space-y-5">

        {/* 1 — Parter */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            1
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Parter
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Sportsbytte er en digital markedsplass der privatpersoner kan kjøpe og selge brukt sportsutstyr,
            organisert rundt norske idrettsklubber.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Kjøpsavtalen inngås direkte mellom <strong className="text-ink">kjøper</strong> og{" "}
            <strong className="text-ink">selger</strong>. Sportsbytte er en formidler og betalingsformidler
            — vi er ikke part i kjøpsavtalen, men håndterer betalingen på vegne av begge parter.
          </p>
          <div className="mt-5 rounded-xl bg-cream p-4 text-sm text-ink-mid space-y-1">
            <p className="font-semibold text-ink">Sportsbytte</p>
            <p>Under etablering — Bergen, Norge</p>
            <p>
              E-post:{" "}
              <a href="mailto:hei@sportsbytte.no" className="text-forest underline underline-offset-2">
                hei@sportsbytte.no
              </a>
            </p>
            <p>Org.nr.: <span className="text-ink-light italic">Oppgis ved registrering</span></p>
          </div>
        </div>

        {/* 2 — Betaling */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            2
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Betaling
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Betaling skjer via <strong className="text-ink">Vipps</strong>. Når du betaler, holdes beløpet
            trygt av Sportsbytte frem til du bekrefter at du har mottatt varen — en ordning vi kaller
            kjøperbeskyttelse.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Kjøper betaler varepris pluss et tjenestegebyr (5 %, eller 2 % for Pro-brukere) i kassen.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Beløpet holdes av Sportsbytte inntil kjøper bekrefter mottak.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Selger mottar betalingen via Vipps innen kort tid etter bekreftelse.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Dersom kjøper ikke bekrefter eller melder fra innen 7 dager, frigjøres betalingen automatisk til selger.
            </li>
          </ul>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            For abonnementer (Pro-konto) belastes Vipps-kontoen din månedlig i henhold til avtalen du
            godkjente. Abonnementet kan sies opp når som helst fra dashbordet ditt.
          </p>
        </div>

        {/* 3 — Levering */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            3
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Levering
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Leveringsmetode avtales mellom kjøper og selger, og angis i annonsen. Mulige alternativer er:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              <span><strong className="text-ink">Hentes av kjøper</strong> — kjøper henter varen på avtalt sted og tid.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              <span><strong className="text-ink">Frakt</strong> — selger sender varen. Fraktkostnad er vist i kassen og betales av kjøper.</span>
            </li>
          </ul>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Selger er ansvarlig for å sende varen innen rimelig tid etter betaling, og for å pakke den forsvarlig.
            Ved forsinkelse eller manglende levering skal kjøper kontakte oss på{" "}
            <a href="mailto:hei@sportsbytte.no" className="text-forest underline underline-offset-2">
              hei@sportsbytte.no
            </a>
            .
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Kjøperbeskyttelsen løper fra betaling er gjennomført. Bekreft mottak i dashbordet ditt
            så snart du har mottatt og kontrollert varen.
          </p>
        </div>

        {/* 4 — Angrerett */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            4
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Angrerett
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Sportsbytte er en markedsplass for salg mellom privatpersoner. Salg mellom to privatpersoner
            reguleres av <strong className="text-ink">kjøpsloven</strong>, ikke forbrukerkjøpsloven.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            <strong className="text-ink">Angrerettloven (14-dagers angrerett) gjelder ikke</strong> for
            kjøp mellom to privatpersoner på denne plattformen.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Dersom en selger driver næringsvirksomhet og selger via Sportsbytte, plikter selger selv å
            opplyse om dette i annonsen, og angrerettloven vil da gjelde for det aktuelle kjøpet.
          </p>
        </div>

        {/* 5 — Retur */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            5
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Retur
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Retur er ikke en automatisk rettighet ved kjøp mellom privatpersoner, men kan avtales direkte
            mellom kjøper og selger.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Dersom varen ikke er som beskrevet i annonsen (vesentlig avvik fra tilstand, størrelse eller
            beskrivelse), kan kjøper melde fra til Sportsbytte innen{" "}
            <strong className="text-ink">48 timer</strong> etter mottak. Vi vil da vurdere om betalingen
            skal holdes tilbake og megle mellom partene.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Meld fra via dashbordet ditt («Rapporter problem») eller på{" "}
              <a href="mailto:hei@sportsbytte.no" className="text-forest underline underline-offset-2">
                hei@sportsbytte.no
              </a>
              .
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Returkostnaden bæres av den parten som vinner tvisten, dersom retur avtales.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Varer returnert uten forhåndsgodkjenning fra Sportsbytte gir ikke automatisk rett til refusjon.
            </li>
          </ul>
        </div>

        {/* 6 — Reklamasjonshåndtering */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            6
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Reklamasjonshåndtering
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Dersom du har en klage på et kjøp eller et salg, kontakter du oss så raskt som mulig:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Via «Rapporter problem»-knappen i dashbordet ditt (anbefalt).
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Via e-post til{" "}
              <a href="mailto:hei@sportsbytte.no" className="text-forest underline underline-offset-2">
                hei@sportsbytte.no
              </a>
              {" "}med ordrenummer, beskrivelse av problemet og eventuelt bilder.
            </li>
          </ul>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Vi behandler reklamasjoner innen <strong className="text-ink">3 virkedager</strong> og innhenter
            dokumentasjon fra begge parter. Mulige utfall er full refusjon, delvis refusjon eller at salget
            fastholdes. Beslutningen meddeles skriftlig per e-post.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Betaling holdes tilbake i Sportsbyttes escrow-system så lenge en aktiv reklamasjon pågår, og
            frigjøres ikke til selger før saken er avsluttet.
          </p>
        </div>

        {/* 7 — Konfliktløsning */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            7
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Konfliktløsning
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Dersom du ikke er fornøyd med vår behandling av en klage, kan du bringe saken inn for:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              <span>
                <strong className="text-ink">Forbrukerrådet</strong> —{" "}
                <a
                  href="https://www.forbrukerradet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest underline underline-offset-2"
                >
                  forbrukerradet.no
                </a>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              <span>
                <strong className="text-ink">EU-kommisjonens klageportal</strong> (ODR) —{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest underline underline-offset-2"
                >
                  ec.europa.eu/consumers/odr
                </a>
              </span>
            </li>
          </ul>
          <p className="mt-3 text-ink-mid leading-relaxed text-sm">
            Tvister som ikke løses i minnelighet, behandles etter norsk rett med Bergen tingrett som verneting.
          </p>
        </div>

        {/* 8 — Brukerkonto og ansvar */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            8
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Brukerkonto og ansvar
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            For å selge på Sportsbytte må du opprette en konto. Som bruker er du ansvarlig for at:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Du er minst 18 år for å gjennomføre transaksjoner selvstendig.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Informasjonen på kontoen din er korrekt og oppdatert.
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">—</span>
              Du holder passordet ditt hemmelig og er ansvarlig for aktivitet via din konto.
            </li>
          </ul>
        </div>

        {/* 9 — Forbudt innhold */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            9
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Forbudt innhold
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-ink-mid">
            {[
              "Våpen, ammunisjon eller farlige gjenstander",
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
        </div>

        {/* 10 — Kontakt */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            10
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Kontakt
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Spørsmål om salgsvilkårene? Ta gjerne kontakt.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:hei@sportsbytte.no"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink hover:border-forest hover:text-forest transition-colors duration-[120ms]"
            >
              hei@sportsbytte.no
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
