import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brukervilkår",
  description: "Les Sportsbyttets brukervilkår for bruk av plattformen.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
        Brukervilkår
      </h1>
      <p className="mt-2 text-sm text-ink-light">Sist oppdatert: 15. april 2026</p>

      <div className="mt-10 space-y-8">
        <Section title="1. Om tjenesten">
          Sportsbyttet er en digital markedsplass for kjøp og salg av brukt
          sportsutstyr mellom privatpersoner, organisert rundt norske
          idrettsklubber. Tjenesten drives av Sportsbyttet AS.
        </Section>

        <Section title="2. Brukerkonto">
          For å selge utstyr eller kjøpe varer må du opprette en brukerkonto.
          Du er ansvarlig for å holde kontoinformasjonen din oppdatert og
          passordet ditt hemmelig. Du må være minst 18 år for å bruke
          tjenesten selvstendig.
        </Section>

        <Section title="3. Annonser og innhold">
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Du er ansvarlig for at annonsene dine er nøyaktige og at varene er som beskrevet.</li>
            <li>Det er kun tillatt å selge lovlig sportsutstyr. Våpen, farlige gjenstander og ulovlige varer er forbudt.</li>
            <li>Sportsbyttet forbeholder seg retten til å fjerne annonser som bryter vilkårene.</li>
            <li>Bilder og tekst du laster opp forblir din eiendom, men du gir Sportsbyttet rett til å vise dem på plattformen.</li>
          </ul>
        </Section>

        <Section title="4. Kjøp og salg">
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Kjøpsavtalen inngås mellom kjøper og selger. Sportsbyttet er ikke part i transaksjonen.</li>
            <li>Betaling skjer via Vipps. Beløpet holdes til kjøper bekrefter mottak.</li>
            <li>Selger er ansvarlig for å sende varen innen avtalt tid.</li>
            <li>Kjøper har 48 timer til å inspisere varen og eventuelt reklamere.</li>
          </ul>
        </Section>

        <Section title="5. Kjøperbeskyttelse">
          Sportsbyttet tilbyr kjøperbeskyttelse på alle transaksjoner via
          plattformen. Dersom varen ikke samsvarer med beskrivelsen, kan kjøper
          åpne en sak innen 48 timer etter mottak. Sportsbyttet vil da
          megle mellom partene.
        </Section>

        <Section title="6. Frakt">
          Frakt håndteres via Bring. Selger er ansvarlig for å pakke varen
          forsvarlig. Fraktlabel genereres automatisk gjennom plattformen.
          Ved skade under transport gjelder Brings transportvilkår.
        </Section>

        <Section title="7. Klubbsider">
          Klubber som registrerer seg på Sportsbyttet får en egen klubbside.
          Klubbadministratorer er ansvarlige for å moderere innhold fra
          medlemmer. Sportsbyttet kan avpublisere klubbsider som bryter vilkårene.
        </Section>

        <Section title="8. Gebyrer">
          Sportsbyttet tar et tjenestegebyr på 8% av salgsprisen ved
          gjennomførte transaksjoner. Gebyret trekkes automatisk fra
          utbetalingen til selger. Det er gratis å opprette annonser.
        </Section>

        <Section title="9. Ansvarsbegrensning">
          Sportsbyttet er en formidlingstjeneste og er ikke ansvarlig for
          kvaliteten på varer som selges, eller for tvister mellom kjøper
          og selger ut over det som følger av kjøperbeskyttelsen.
        </Section>

        <Section title="10. Endringer">
          Vi kan oppdatere disse vilkårene. Ved vesentlige endringer varsles
          du via e-post. Fortsatt bruk av tjenesten etter varsling anses som
          aksept av de nye vilkårene.
        </Section>

        <Section title="11. Kontakt">
          Spørsmål om vilkårene kan rettes til:
          <br />
          <strong>E-post:</strong> vilkar@sportsbyttet.no
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
