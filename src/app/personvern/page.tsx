import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personvernerklæring",
  description: "Les Sportsbyttets personvernerklæring — hvordan vi behandler dine personopplysninger.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
        Personvernerklæring
      </h1>
      <p className="mt-2 text-sm text-ink-light">Sist oppdatert: 15. april 2026</p>

      <div className="mt-10 space-y-8">
        <Section title="1. Hvem er vi?">
          Sportsbyttet AS (org.nr. under registrering) er behandlingsansvarlig
          for personopplysninger som samles inn via sportsbyttet.no. Vi er
          basert i Bergen, Norge.
        </Section>

        <Section title="2. Hvilke opplysninger samler vi inn?">
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Kontoinformasjon:</strong> Navn, e-postadresse, telefonnummer og profilbilde ved registrering.</li>
            <li><strong>Klubbmedlemskap:</strong> Hvilke klubber du er medlem av på plattformen.</li>
            <li><strong>Annonsedata:</strong> Bilder, beskrivelser og priser du legger inn i annonser.</li>
            <li><strong>Transaksjonsdata:</strong> Kjøps- og salgshistorikk, betalingsinformasjon (håndtert av Vipps).</li>
            <li><strong>Bruksdata:</strong> Informasjon om hvordan du bruker tjenesten (sidevisninger, søk, klikk).</li>
          </ul>
        </Section>

        <Section title="3. Hvorfor behandler vi opplysningene?">
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>For å levere tjenesten — opprette annonser, gjennomføre kjøp, og administrere klubbsider.</li>
            <li>For å sikre trygg handel — verifisere brukere og forhindre svindel.</li>
            <li>For å forbedre tjenesten — analysere bruksmønstre og optimalisere opplevelsen.</li>
            <li>For å kommunisere med deg — sende varsler om kjøp, salg og meldinger.</li>
          </ul>
        </Section>

        <Section title="4. Hvem deler vi opplysninger med?">
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Vipps MobilePay:</strong> For betalingsbehandling.</li>
            <li><strong>Bring:</strong> For fraktlabel og sporing.</li>
            <li><strong>Supabase (EU):</strong> For sikker datalagring.</li>
            <li><strong>Vercel:</strong> For hosting av nettsiden.</li>
          </ul>
          <p className="mt-3">Vi selger aldri dine personopplysninger til tredjeparter.</p>
        </Section>

        <Section title="5. Dine rettigheter">
          Du har rett til innsyn, retting, sletting, dataportabilitet og å
          protestere mot behandling av dine personopplysninger. Kontakt oss
          på <strong>personvern@sportsbyttet.no</strong> for å utøve dine
          rettigheter.
        </Section>

        <Section title="6. Informasjonskapsler (cookies)">
          Vi bruker nødvendige informasjonskapsler for at nettsiden skal
          fungere, samt analysekapsler for å forstå hvordan tjenesten brukes.
          Du kan når som helst endre dine innstillinger.
        </Section>

        <Section title="7. Sikkerhet">
          Vi bruker bransjestandard sikkerhetstiltak for å beskytte dine
          data, inkludert kryptering, tilgangskontroll og regelmessige
          sikkerhetsrevisjoner.
        </Section>

        <Section title="8. Kontakt">
          Har du spørsmål om personvern? Kontakt oss:
          <br />
          <strong>E-post:</strong> personvern@sportsbyttet.no
          <br />
          <strong>Adresse:</strong> Sportsbyttet AS, Bergen, Norge
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-ink mb-3">{title}</h2>
      <div className="text-ink-mid leading-relaxed text-sm">{children}</div>
    </section>
  );
}
