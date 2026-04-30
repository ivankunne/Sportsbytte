import Link from "next/link";
import type { Metadata } from "next";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sportsbytte",
  url: "https://sportsbytte.no",
  logo: "https://sportsbytte.no/favicon.png",
  description: "Norges markedsplass for brukt sportsutstyr, bygget rundt idrettsklubbene.",
  email: "hei@sportsbytte.no",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Bergen",
    addressCountry: "NO",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "hei@sportsbytte.no",
    contactType: "customer service",
    availableLanguage: "Norwegian",
  },
  sameAs: ["https://sportsbytte.no"],
};

export const metadata: Metadata = {
  title: "Om oss — Sportsbytte",
  description:
    "Historien bak Sportsbytte — Norges markedsplass for brukt sportsutstyr, bygget rundt idrettsklubbene. Lær om oppdraget vårt, historien og menneskene bak.",
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl mb-12">
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
          Om oss
        </span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink">
          Om Sportsbytte
        </h1>
        <p className="mt-3 text-ink-mid leading-relaxed text-lg">
          Vi kobler idrettsklubbene og medlemmene deres — slik at brukt
          sportsutstyr finner nye eiere i stedet for å samle støv i kjelleren.
          Trygt, lokalt og bygget for norsk idrettsliv.
        </p>
      </div>

      <div className="space-y-5">
        {/* ─── OPPDRAG ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            Oppdraget vårt
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink">
            Brukt utstyr hører hjemme i klubben — ikke på søppeldynga
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed">
            Hvert år kjøper norske idrettsfamilier nytt utstyr til barna som
            vokser fort. Det gamle havner i boden. Det nye koster for mye.
            Mellom disse to realitetene finnes et gap vi ønsker å fylle.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed">
            Sportsbytte gir hver idrettsklubb sin egen digitale markedsplass
            der medlemmene kan kjøpe og selge brukt utstyr — trygt, fordi du
            handler med folk fra din egen klubb. Ikke med fremmede på Finn.no.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Klubben først",
                desc: "Alle beslutninger starter med spørsmålet: gjør dette klubbopplevelsen bedre?",
              },
              {
                title: "Bærekraft i praksis",
                desc: "Brukt er det nye nye. Gi utstyret ett liv til og spar penger langs veien.",
              },
              {
                title: "Trygg handel",
                desc: "Kortbetaling og kjøperbeskyttelse. Du vet hvem du handler med.",
              },
            ].map((v) => (
              <div key={v.title} className="rounded-xl bg-cream p-5">
                <h3 className="font-display text-base font-semibold text-ink">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-ink-mid leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── HISTORIEN ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            Historien
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink">
            En skitrener, en bod full av utstyr og en idé
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed">
            Ideen til Sportsbytte kom en høstdag i Bergen. En skitrener la
            merke til at halve garderoben til juniorlaget var full av utstyr
            barna hadde vokst ut av — mens nye foreldre desperat lette etter
            rimelig utstyr til kommende sesong. Løsningen burde vært enkel.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed">
            Finn.no er for upersonlig. Facebook-grupper er kaotiske og uten
            trygg betaling. Byttemarkedet på parkeringsplassen skjer én gang i
            året. Ingen av delene var gode nok.
          </p>
          <p className="mt-3 text-ink-mid leading-relaxed">
            Så ble Sportsbytte bygget — en plattform der klubben er
            utgangspunktet, tilliten er innebygd og handelen er like enkel som
            kortbetaling. Vi er fremdeles tidlig, men fundamentet er
            solid og klubbene som er med gir oss tydelige tilbakemeldinger om
            hva som fungerer.
          </p>
        </div>

        {/* ─── TEAMET ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            Menneskene bak
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink">
            Et lite team med store ambisjoner
          </h2>
          <p className="mt-4 text-ink-mid leading-relaxed">
            Sportsbytte er grunnlagt av Ivan fra Bergen — med bakgrunn fra
            teknologi og idrettslag, og en grunnleggende overbevisning om at
            bruktmarkedet for sportsutstyr fortjener bedre enn
            Facebook-grupper. Plattformen er bygget fra bunnen av med norske
            idrettsfamilier i tankene.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-forest-light flex items-center justify-center text-forest font-bold font-display text-lg flex-shrink-0">
              I
            </div>
            <div>
              <p className="font-semibold text-ink">Ivan</p>
              <p className="text-sm text-ink-light">Grunnlegger</p>
              <p className="text-sm text-ink-mid mt-0.5">Bergen, Norge</p>
            </div>
          </div>
          <p className="mt-5 text-sm text-ink-mid leading-relaxed">
            Vi er åpne for å høre fra personer som brenner for norsk
            idrettsliv og ønsker å bidra til det vi bygger. Ta gjerne
            kontakt.
          </p>
        </div>

        {/* ─── STATISTIKK ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-7 border border-border">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-ink-light">
            Sportsbytte i tall
          </span>
          <div className="mt-6 grid grid-cols-3 gap-6 text-center">
            {[
              { value: "4", label: "klubber" },
              { value: "20+", label: "annonser" },
              { value: "2026", label: "lansering" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-4xl sm:text-5xl font-bold text-forest">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-ink-mid">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-light text-center">
            Vi er i pilotfase. Tallene vokser — og vi er stolt av hver
            eneste klubb og annonse.
          </p>
        </div>

        {/* ─── CTA ──────────────────────────────────────────────────── */}
        <div className="bg-forest rounded-2xl p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-white">
            Bli med på reisen
          </h2>
          <p className="mt-2 text-white/75 max-w-md mx-auto text-sm leading-relaxed">
            Vi leter alltid etter klubber som vil teste plattformen og gi
            tilbakemeldinger. Registrering er gratis og tar fem minutter.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registrer-klubb"
              className="rounded-lg bg-amber px-7 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all duration-[120ms] shadow-lg shadow-amber/25"
            >
              Registrer din klubb
            </Link>
            <Link
              href="/kontakt"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-[120ms]"
            >
              Ta kontakt med oss →
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
