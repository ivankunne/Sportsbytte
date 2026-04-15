import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om oss",
  description: "Historien bak Sportsbyttet — Norges markedsplass for brukt sportsutstyr, bygget rundt idrettsklubber i Bergen.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
        Om Sportsbyttet
      </h1>

      <p className="mt-8 text-ink-mid leading-relaxed text-lg">
        Sportsbyttet er Norges markedsplass for brukt sportsutstyr — bygget
        rundt idrettsklubbene. Vi tror at det beste utstyret allerede finnes
        i boden til noen i klubben din.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">
          Vår historie
        </h2>
        <p className="text-ink-mid leading-relaxed">
          Ideen til Sportsbyttet kom en høstdag i Bergen. En skitrener la merke
          til at halve garderoben til juniorlaget var fullt av utstyr barna hadde
          vokst ut av, mens nye foreldre desperat lette etter rimelig utstyr for
          sesongen. Løsningen burde vært enkel — men Finn.no er for upersonlig
          og Facebook-grupper for kaotiske.
        </p>
        <p className="mt-4 text-ink-mid leading-relaxed">
          Vi bygde Sportsbyttet for å gi hver klubb sin egen digitale
          byttebod. Et trygt sted der du vet hvem som selger, fordi dere
          tilhører samme fellesskap. Med Vipps-betaling og Bring-frakt er
          handelen like enkel som å bestille noe fra en nettbutikk — men med
          den tryggheten som kun klubbtilhørighet gir.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-ink mb-6">
          Hva vi står for
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              title: "Klubben først",
              desc: "Alt vi gjør starter med klubben. Hver funksjon vi lager spør vi: gjør dette klubbopplevelsen bedre?",
            },
            {
              title: "Bærekraft i praksis",
              desc: "Brukt er det nye nye. Ved å gi utstyr et nytt liv reduserer vi avfall og gjør sport tilgjengelig for flere.",
            },
            {
              title: "Trygghet i handel",
              desc: "Vipps-betaling, kjøperbeskyttelse og Bring-frakt. Du handler trygt med folk du deler garderobe med.",
            },
            {
              title: "Norsk og lokal",
              desc: "Vi er et norsk selskap, bygget for norske forhold. All support på norsk, og vi forstår idrettsklubber.",
            },
          ].map((value) => (
            <div key={value.title} className="bg-white rounded-xl p-5">
              <h3 className="font-display text-lg font-semibold text-ink">{value.title}</h3>
              <p className="mt-2 text-sm text-ink-mid leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-ink mb-4">
          Grunnlegger
        </h2>
        <p className="text-ink-mid leading-relaxed">
          Sportsbyttet er startet av Ivan fra Bergen — med bakgrunn fra
          teknologi, idrettslag og en overbevisning om at bruktmarkedet
          for sportsutstyr fortjener bedre enn Facebook-grupper.
        </p>
        <div className="mt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-forest-light flex items-center justify-center text-forest font-bold font-display text-lg">
              I
            </div>
            <div>
              <p className="font-medium text-ink">Ivan</p>
              <p className="text-sm text-ink-light">Grunnlegger</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 bg-forest-light rounded-2xl p-8 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Bli med på reisen
        </h2>
        <p className="mt-2 text-ink-mid max-w-md mx-auto">
          Vi leter alltid etter klubber som vil teste plattformen. Registrer
          din klubb i dag — det er helt gratis.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/registrer-klubb"
            className="rounded-lg bg-amber px-7 py-3 text-sm font-semibold text-white hover:brightness-92 transition-colors duration-[120ms]"
          >
            Registrer din klubb
          </Link>
          <Link
            href="/kontakt"
            className="text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
          >
            Eller ta kontakt →
          </Link>
        </div>
      </section>
    </div>
  );
}
