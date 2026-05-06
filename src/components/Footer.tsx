import Image from "next/image";
import Link from "next/link";


export function Footer() {
  return (
    <footer className="bg-forest text-white/60 pb-16 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <Image src="/logo-sportsbytte-footer-removebg-preview.png" alt="Sportsbytte" width={160} height={43} className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="mt-3 text-sm text-white/60 max-w-md">
              Norges markedsplass for brukt sportsutstyr. Klubbmedlemmer kjøper
              og selger utstyr trygt — med kortbetaling og kjøperbeskyttelse.
            </p>

            {/* Social / contact links */}
            <div className="mt-4 flex items-center gap-5">
              <a
                href="mailto:hei@sportsbytte.no"
                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors duration-[120ms]"
              >
                {/* Envelope icon */}
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span>hei@sportsbytte.no</span>
              </a>
              <a
                href="https://instagram.com/sportsbytte"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors duration-[120ms]"
              >
                {/* Instagram icon */}
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
                <span>@sportsbytte</span>
              </a>
            </div>
          </div>

          {/* Sportsbytte column */}
          <div>
            <h4 className="font-medium text-white text-sm mb-3">Sportsbytte</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/om-oss" className="text-sm hover:text-white transition-colors duration-[120ms]">
                  Om oss
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-sm hover:text-white transition-colors duration-[120ms]">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/personvern" className="text-sm hover:text-white transition-colors duration-[120ms]">
                  Personvern
                </Link>
              </li>
              <li>
                <Link href="/vilkar" className="text-sm hover:text-white transition-colors duration-[120ms]">
                  Vilkår
                </Link>
              </li>
            </ul>
          </div>

          {/* For klubber column */}
          <div>
            <h4 className="font-medium text-white text-sm mb-3">For klubber</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/registrer-klubb" className="text-sm hover:text-white transition-colors duration-[120ms]">
                  Registrer klubb
                </Link>
              </li>
              <li>
                <Link href="/priser" className="text-sm hover:text-white transition-colors duration-[120ms]">
                  Priser
                </Link>
              </li>
              <li>
                <Link href="/for-klubber" className="text-sm hover:text-white transition-colors duration-[120ms]">
                  For idrettslag
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-col items-start gap-1">
            <p className="text-xs text-white/40">
              © 2026 Sportsbytte · Alle rettigheter reservert.
            </p>
            <p className="text-xs text-white/30">
              Driftes av Frameflow / Ivan Kunne · Org.nr. 936 600 018 ·{" "}
              <a href="mailto:ivan@frameflow.no" className="hover:text-white/50 transition-colors duration-[120ms]">
                ivan@frameflow.no
              </a>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40">Trygg handel med</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/stripelogo.png"
              alt="Stripe"
              className="h-5 w-auto opacity-60 hover:opacity-90 brightness-0 invert transition-opacity duration-[120ms]"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
