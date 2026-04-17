"use client";

import { useEffect, useRef, useState } from "react";

interface StatsBarProps {
  listings: number;
  clubs: number;
  sold: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number, duration: number, active: boolean): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    startTimeRef.current = null;

    function tick(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, active]);

  return value;
}

export function StatsBar({ listings, clubs, sold }: StatsBarProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const listingsCount = useCountUp(listings, 1200, active);
  const clubsCount = useCountUp(clubs, 1200, active);
  const soldCount = useCountUp(sold, 1200, active);

  return (
    <section ref={ref} className="bg-forest-mid text-white">
      <div className="mx-auto max-w-7xl px-6 sm:px-6 lg:px-12 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
          <div>
            <span className="text-2xl font-bold font-display tabular-nums">
              {listingsCount.toLocaleString("nb-NO")}
            </span>
            <span className="ml-2 text-sm text-white/60">aktive annonser</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/20" />
          <div>
            <span className="text-2xl font-bold font-display tabular-nums">
              {clubsCount.toLocaleString("nb-NO")}
            </span>
            <span className="ml-2 text-sm text-white/60">klubber</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/20" />
          <div>
            <span className="text-2xl font-bold font-display tabular-nums">
              {soldCount.toLocaleString("nb-NO")}
            </span>
            <span className="ml-2 text-sm text-white/60">solgte varer</span>
          </div>
        </div>
      </div>
    </section>
  );
}
