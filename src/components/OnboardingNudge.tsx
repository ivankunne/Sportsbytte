"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const DISMISSED_KEY = "club_nudge_dismissed_v1";

export function OnboardingNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (profile && profile.club_id === null) setShow(true);
    }

    check();
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="bg-amber/10 border-b border-amber/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber text-white text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <p className="text-sm text-ink">
            <span className="font-medium">Du er ikke med i en klubb ennå.</span>{" "}
            <span className="text-ink-mid">Finn din idrettsklubb og få tilgang til hele markedsplassen.</span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/klubber"
            className="rounded-lg bg-amber px-4 py-1.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
          >
            Finn klubb
          </Link>
          <button
            onClick={dismiss}
            className="text-ink-light hover:text-ink transition-colors duration-[120ms]"
            aria-label="Lukk"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
