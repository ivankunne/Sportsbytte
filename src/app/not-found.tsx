import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <div className="text-6xl font-bold font-display text-forest/20 mb-4">404</div>
      <h1 className="font-display text-3xl font-bold text-ink">
        Siden ble ikke funnet
      </h1>
      <p className="mt-3 text-ink-light max-w-md mx-auto">
        Beklager, vi finner ikke siden du leter etter.
        Den kan ha blitt flyttet eller fjernet.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-forest px-7 py-3 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
        >
          Tilbake til forsiden
        </Link>
        <Link
          href="/utforsk"
          className="text-sm font-medium text-forest hover:text-forest-mid transition-colors duration-[120ms]"
        >
          Utforsk utstyr →
        </Link>
      </div>
    </div>
  );
}
