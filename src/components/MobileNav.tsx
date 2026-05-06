"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Hjem",
    exact: true,
    protected: false,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    href: "/utforsk",
    label: "Utforsk",
    exact: false,
    protected: false,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    href: "/selg",
    label: "Selg",
    exact: false,
    sell: true,
    protected: false,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    href: "/dashboard?tab=innboks",
    matchHref: "/dashboard",
    label: "Meldinger",
    exact: false,
    protected: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    href: "/dashboard?tab=profil",
    matchHref: null,
    label: "Profil",
    exact: false,
    protected: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  function isActive(item: typeof NAV_ITEMS[number]): boolean {
    const match = item.matchHref ?? item.href.split("?")[0];
    if (item.exact) return pathname === match;
    if (item.sell) return pathname === "/selg";
    if (item.label === "Meldinger") return pathname.startsWith("/dashboard");
    if (item.label === "Profil") return false;
    return match !== "/" && pathname.startsWith(match);
  }

  function handleProtectedTap(item: typeof NAV_ITEMS[number]) {
    if (isLoggedIn) {
      router.push(item.href);
    } else {
      setAuthPrompt(item.label);
    }
  }

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-border safe-area-bottom">
        <div className="grid grid-cols-5 h-16 px-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);

            if (item.sell) {
              return (
                <Link
                  key="selg"
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-1"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-[120ms] ${active ? "bg-forest-mid" : "bg-forest"}`}>
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </span>
                  <span className="text-[10px] font-semibold text-forest leading-none -mt-0.5">Selg</span>
                </Link>
              );
            }

            if (item.protected) {
              return (
                <button
                  key={`${item.href}-${item.label}`}
                  onClick={() => handleProtectedTap(item)}
                  className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-[120ms] w-full ${
                    active ? "text-forest" : "text-ink-light"
                  }`}
                >
                  <span className={active ? "text-forest" : "text-ink-light"}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-[120ms] ${
                  active ? "text-forest" : "text-ink-light"
                }`}
              >
                <span className={active ? "text-forest" : "text-ink-light"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Auth prompt bottom sheet */}
      {authPrompt && (
        <div className="fixed inset-0 z-[60] flex items-end md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setAuthPrompt(null)}
          />
          <div className="relative w-full bg-white rounded-t-2xl px-6 pt-6 pb-10 shadow-2xl">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-cream">
              {authPrompt === "Meldinger" ? (
                <svg className="h-6 w-6 text-ink-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-ink-mid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
            <h2 className="font-display text-xl font-bold text-ink text-center">
              Logg inn for å se {authPrompt === "Meldinger" ? "meldinger" : "profilen din"}
            </h2>
            <p className="mt-2 text-sm text-ink-light text-center">
              Du må være innlogget for å få tilgang til {authPrompt === "Meldinger" ? "innboksen din" : "profil og innstillinger"}.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/logg-inn"
                onClick={() => setAuthPrompt(null)}
                className="w-full rounded-xl bg-forest py-3.5 text-center text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
              >
                Logg inn
              </Link>
              <Link
                href="/logg-inn?mode=signup"
                onClick={() => setAuthPrompt(null)}
                className="w-full rounded-xl border border-border py-3.5 text-center text-sm font-semibold text-ink hover:bg-cream transition-colors duration-[120ms]"
              >
                Registrer deg
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
