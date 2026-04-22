import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personvernerklæring — Sportsbytte",
  description:
    "Personvernerklæring for Sportsbytte. Les om hvilke data vi samler inn, hvordan vi bruker dem og dine rettigheter.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="max-w-2xl mb-12">
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
          Personvern
        </span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink">
          Personvernerklæring
        </h1>
        <p className="mt-3 text-ink-mid leading-relaxed">
          Her forklarer vi hva slags data vi samler inn, hvorfor vi gjør det
          og hvilke rettigheter du har. Vi prøver å holde dette så klart og
          ærlig som mulig. Sist oppdatert{" "}
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
            Hvilken data vi samler inn
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Vi samler bare inn det vi faktisk trenger for å drive tjenesten.
            Her er en oversikt:
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Kontoinformasjon",
                desc: "Navn, e-postadresse og eventuelt telefonnummer når du registrerer deg.",
              },
              {
                title: "Klubbtilknytning",
                desc: "Hvilke idrettsklubber du er tilknyttet på plattformen.",
              },
              {
                title: "Annonsedata",
                desc: "Bilder, beskrivelser, priser og kategorier du legger inn i annonser.",
              },
              {
                title: "Transaksjonsdata",
                desc: "Kjøps- og salgshistorikk. Selve betalingen håndteres av Vipps.",
              },
              {
                title: "Bruksdata",
                desc: "Anonymisert informasjon om hvordan du navigerer på siden — for å forbedre tjenesten.",
              },
              {
                title: "Kommunikasjon",
                desc: "Meldinger du sender via plattformen til andre brukere eller til oss.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-cream p-4">
                <h3 className="font-display text-sm font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-ink-mid leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            2
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Hvordan vi bruker data
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Personopplysningene dine brukes utelukkende til formålene nedenfor.
            Vi selger aldri data til tredjepart for markedsføring.
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-mid">
            {[
              "Levere tjenesten — opprette annonser, gjennomføre kjøp og administrere klubbsider.",
              "Sørge for trygg handel — verifisere brukere og motvirke svindel.",
              "Sende varslinger — om kjøp, salg, meldinger og statusoppdateringer.",
              "Forbedre plattformen — analysere anonymiserte bruksmønstre.",
              "Overholde lovpålagte krav — for eksempel ved tvist eller krav fra myndigheter.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="text-forest font-bold mt-0.5 flex-shrink-0">
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 3 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            3
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Deling med tredjepart
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            For å drive tjenesten bruker vi noen utvalgte leverandører. Her er
            en fullstendig liste over hvem vi deler data med og til hva:
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                name: "Supabase",
                role: "Databaselagring og autentisering",
                note: "Data lagres i EU (Frankfurt). Supabase er GDPR-kompatibel.",
              },
              {
                name: "Resend",
                role: "Utsending av e-post",
                note: "Brukes for transaksjonsvarslinger og systemeposter.",
              },
              {
                name: "Vipps MobilePay",
                role: "Betalingsbehandling",
                note: "Vi deler kun nødvendig informasjon for å fullføre betalingen.",
              },
              {
                name: "Bring",
                role: "Fraktetiketter og sporing",
                note: "Navn og adresse for levering sendes til Bring ved frakt.",
              },
              {
                name: "Vercel",
                role: "Hosting og infrastruktur",
                note: "Nettsiden kjøres på Vercels infrastruktur i EU.",
              },
            ].map((vendor) => (
              <div
                key={vendor.name}
                className="flex items-start gap-4 rounded-xl border border-border p-4"
              >
                <div className="h-9 w-9 rounded-lg bg-forest-light flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-xs font-bold text-forest">
                    {vendor.name[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">
                    {vendor.name}{" "}
                    <span className="font-normal text-ink-light">
                      — {vendor.role}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-mid">{vendor.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            4
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Dine rettigheter
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Etter GDPR har du følgende rettigheter knyttet til dine
            personopplysninger:
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Innsyn",
                desc: "Du kan til enhver tid be om en oversikt over hvilke personopplysninger vi har om deg.",
              },
              {
                title: "Retting",
                desc: "Dersom data om deg er feil eller ufullstendige, kan du kreve at de rettes.",
              },
              {
                title: "Sletting",
                desc: "Du kan be om at kontoen og alle personopplysninger knyttet til den slettes.",
              },
              {
                title: "Dataportabilitet",
                desc: "Du kan be om å få dine data utlevert i et maskinlesbart format.",
              },
            ].map((right) => (
              <div key={right.title} className="rounded-xl bg-cream p-4">
                <h3 className="font-display text-sm font-semibold text-ink">
                  {right.title}
                </h3>
                <p className="mt-1 text-sm text-ink-mid leading-relaxed">
                  {right.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink-mid">
            Send en e-post til{" "}
            <a
              href="mailto:personvern@sportsbytte.no"
              className="text-forest underline underline-offset-2 hover:text-forest-mid transition-colors duration-[120ms]"
            >
              personvern@sportsbytte.no
            </a>{" "}
            for å utøve en av disse rettighetene. Vi svarer innen 30 dager.
          </p>
        </div>

        {/* 5 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            5
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Informasjonskapsler (cookies)
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Vi bruker informasjonskapsler for at nettsiden skal fungere
            korrekt og for å forstå hvordan tjenesten brukes. Her er hva vi
            bruker:
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-mid">
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">
                —
              </span>
              <span>
                <strong className="text-ink">Nødvendige kapsler:</strong>{" "}
                For å holde deg innlogget og huske innstillinger. Disse kan
                ikke slås av uten at tjenesten slutter å fungere.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-forest font-bold mt-0.5 flex-shrink-0">
                —
              </span>
              <span>
                <strong className="text-ink">Analysekapsler:</strong>{" "}
                Anonymisert statistikk om sidebruk, for eksempel hvilke sider
                som besøkes mest. Ingen personopplysninger lagres her.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-sm text-ink-mid">
            Du kan til enhver tid tømme informasjonskapsler i
            nettleserinnstillingene dine.
          </p>
        </div>

        {/* 6 */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            6
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-ink">
            Kontakt for personvernspørsmål
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed text-sm">
            Har du spørsmål om hvordan vi behandler personopplysningene dine,
            eller ønsker du å utøve en av rettighetene dine? Ta kontakt:
          </p>
          <div className="mt-5 rounded-xl bg-cream p-5">
            <p className="text-sm font-semibold text-ink">
              Sportsbytte — Personvernansvarlig
            </p>
            <p className="mt-1 text-sm text-ink-mid">Bergen, Norge</p>
            <a
              href="mailto:personvern@sportsbytte.no"
              className="mt-2 inline-block text-sm text-forest underline underline-offset-2 hover:text-forest-mid transition-colors duration-[120ms]"
            >
              personvern@sportsbytte.no
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-mid">
            Du kan også benytte{" "}
            <Link
              href="/kontakt"
              className="text-forest underline underline-offset-2 hover:text-forest-mid transition-colors duration-[120ms]"
            >
              kontaktskjemaet vårt
            </Link>
            . Vi svarer normalt innen 24 timer på hverdager.
          </p>
          <p className="mt-3 text-sm text-ink-mid">
            Dersom du mener vi behandler data i strid med personvernregelverket,
            har du rett til å klage til{" "}
            <a
              href="https://www.datatilsynet.no"
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest underline underline-offset-2 hover:text-forest-mid transition-colors duration-[120ms]"
            >
              Datatilsynet
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
