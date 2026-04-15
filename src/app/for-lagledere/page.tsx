import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For lagledere",
  description: "Se hvordan Sportsbyttet hjelper lagledere med digitale byttemarked, utstyrsoversikt og kommunikasjon med foreldre.",
};

export default function ForTeamLeadersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="max-w-2xl">
        <span className="text-xs font-bold text-amber uppercase tracking-wider">
          For lagledere
        </span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
          Gi klubben din en digital byttebod
        </h1>
        <p className="mt-4 text-lg text-ink-mid leading-relaxed">
          Som lagleder vet du at utstyrsbytting allerede skjer — i
          garderoben, på Facebook, på treninger. Sportsbyttet samler alt på
          ett sted og gjør det trygt, enkelt og organisert.
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          {
            icon: (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            ),
            title: "Engasjer medlemmene",
            desc: "Gi medlemmene en grunn til å besøke klubbsiden. Brukt utstyr er relevant for alle — fra juniorer til veteraner.",
          },
          {
            icon: (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            title: "Senk terskelen for nye",
            desc: "Nye medlemmer kan kjøpe rimelig utstyr fra erfarne. Ingen trenger å investere tusenvis for å prøve en ny sport.",
          },
          {
            icon: (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            ),
            title: "Statistikk og innsikt",
            desc: "Se hva som selges, hvem som er aktive og hvordan klubbsiden utvikler seg over tid. Rapporter for styremøtet.",
          },
          {
            icon: (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            ),
            title: "Digitale byttemarked",
            desc: "Organiser byttemarked digitalt — sett dato, promover til medlemmer, og la alt skje på klubbsiden.",
          },
          {
            icon: (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            ),
            title: "Trygg for alle",
            desc: "Vipps-betaling og kjøperbeskyttelse. Ingen kontanthandel, ingen risiko. Foreldre kan trygt la ungdom handle.",
          },
          {
            icon: (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            ),
            title: "Bærekraftig profil",
            desc: "Vis at klubben tar miljøansvar. Gjenbruk av utstyr er bra for miljøet — og for omdømmet.",
          },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl p-6 border border-border">
            <div className="text-forest mb-3">{item.icon}</div>
            <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
            <p className="mt-2 text-sm text-ink-mid leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* How to get started */}
      <div className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink text-center mb-10">
          Slik kommer du i gang
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Registrer klubben", desc: "Fyll ut skjemaet — tar 2 minutter." },
            { step: "2", title: "Tilpass klubbsiden", desc: "Last opp logo, velg farger, skriv beskrivelse." },
            { step: "3", title: "Del med medlemmer", desc: "Send invitasjonslenken på e-post eller i klubb-appen." },
            { step: "4", title: "Se utstyret strømme inn", desc: "Medlemmene legger ut, og handelen er i gang!" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white font-bold font-display">
                {item.step}
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vision quote */}
      <div className="mt-16 bg-forest-light rounded-2xl p-8 sm:p-10">
        <blockquote className="text-center">
          <p className="font-display text-xl sm:text-2xl text-ink leading-relaxed italic">
            &ldquo;Tenk deg at all utstyrsbyttingen i klubben skjer på ett
            sted — enkelt, trygt og organisert. Det er det vi bygger.&rdquo;
          </p>
          <footer className="mt-4">
            <p className="font-medium text-ink">Ivan</p>
            <p className="text-sm text-ink-light">Grunnlegger, Sportsbyttet</p>
          </footer>
        </blockquote>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Klar til å komme i gang?
        </h2>
        <p className="mt-2 text-ink-mid">
          Registrer klubben gratis — vi hjelper deg med resten.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/registrer-klubb"
            className="rounded-lg bg-amber px-7 py-3 text-sm font-semibold text-white hover:brightness-92 transition-colors duration-[120ms]"
          >
            Registrer din klubb
          </Link>
          <Link
            href="/priser"
            className="text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
          >
            Se priser →
          </Link>
        </div>
      </div>
    </div>
  );
}
