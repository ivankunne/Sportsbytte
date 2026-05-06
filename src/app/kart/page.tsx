import { Suspense } from "react";
import { KartView } from "./KartView";

export const metadata = {
  title: "Kart — Sportsbytte",
  description: "Se sportsutstyr til salgs på kart nær deg",
};

export default function KartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-ink">Annonser på kart</h1>
        <p className="text-sm text-ink-light mt-0.5">Se sportsutstyr til salgs nær deg</p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center h-[600px] rounded-xl bg-white border border-border">
          <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
        </div>
      }>
        <KartView />
      </Suspense>
    </div>
  );
}
