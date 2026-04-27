"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Logo } from "./Logo";
import { LoginModal } from "./LoginModal";
import type {
  ListingWithRelations,
  Club,
  ProfileWithClub,
} from "@/lib/queries";

type QuickResult = {
  type: "listing" | "club" | "profile";
  id: number;
  title: string;
  subtitle: string;
  href: string;
  avatar?: string;
  color?: string;
  price?: number;
};

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuickResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [userName, setUserName] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pendingSelg, setPendingSelg] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function checkNewMessages(profileId: number, email: string) {
    // Default to 7 days ago if user has never visited dashboard
    const since = localStorage.getItem("dashboard_last_visited")
      ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: sellerConvs }, { data: buyerConvs }] = await Promise.all([
      supabase.from("conversations").select("id").eq("seller_id", profileId),
      supabase.from("conversations").select("id").eq("buyer_email", email),
    ]);

    const sellerIds = ((sellerConvs ?? []) as { id: string }[]).map((c) => c.id);
    const buyerIds = ((buyerConvs ?? []) as { id: string }[]).map((c) => c.id);

    let total = 0;

    // Messages from buyers in seller conversations (is_from_seller=false = buyer sent it)
    if (sellerIds.length) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", sellerIds)
        .eq("is_from_seller", false)
        .gt("created_at", since);
      total += count ?? 0;
    }

    // Messages from sellers in buyer conversations (is_from_seller=true = seller sent it)
    if (buyerIds.length) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", buyerIds)
        .eq("is_from_seller", true)
        .gt("created_at", since);
      total += count ?? 0;
    }

    setHasNewMessages(total > 0);
  }

  // Track auth state
  useEffect(() => {
    async function loadFromSession(session: { user: { id: string; email?: string } }) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
      setUserName(profile?.name ?? session.user.email?.split("@")[0] ?? "Meg");
      if (profile?.id && session.user.email) {
        checkNewMessages(profile.id, session.user.email);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadFromSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Recovery session is only valid for changing the password — don't log the user in globally
      if (event === "PASSWORD_RECOVERY") return;
      if (session) {
        loadFromSession(session);
      } else {
        setUserName(null);
        setHasNewMessages(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelgClick(e: React.MouseEvent) {
    if (!userName) {
      e.preventDefault();
      setPendingSelg(true);
      setLoginOpen(true);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setResults([]);
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const quickSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const pattern = `%${q.trim()}%`;

    const [listingsRes, clubsRes, profilesRes] = await Promise.all([
      supabase
        .from("listings")
        .select("*, clubs(*), profiles!listings_seller_id_fkey(*)")
        .eq("is_sold", false)
        .or(`title.ilike.${pattern},category.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("clubs")
        .select("*")
        .ilike("name", pattern)
        .limit(3),
      supabase
        .from("profiles")
        .select("*, clubs(*)")
        .or(`name.ilike.${pattern},bio.ilike.${pattern}`)
        .limit(3),
    ]);

    const items: QuickResult[] = [];

    for (const c of (clubsRes.data ?? []) as Club[]) {
      items.push({
        type: "club",
        id: c.id,
        title: c.name,
        subtitle: `${c.members.toLocaleString("nb-NO")} medlemmer • ${c.active_listings} annonser`,
        href: `/klubb/${c.slug}`,
        avatar: c.initials,
        color: c.color,
      });
    }

    for (const p of (profilesRes.data ?? []) as ProfileWithClub[]) {
      items.push({
        type: "profile",
        id: p.id,
        title: p.name,
        subtitle: `${p.clubs?.name ?? "Ingen klubb"} • ${p.total_sold} solgt`,
        href: `/profil/${p.slug}`,
        avatar: p.avatar,
      });
    }

    for (const l of (listingsRes.data ?? []) as ListingWithRelations[]) {
      items.push({
        type: "listing",
        id: l.id,
        title: l.title,
        subtitle: `${l.price.toLocaleString("nb-NO")} kr • ${l.clubs.name}`,
        href: `/annonse/${l.id}`,
        price: l.price,
      });
    }

    setResults(items);
    setSelectedIdx(-1);
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => quickSearch(query), 200);
    return () => clearTimeout(id);
  }, [query, quickSearch]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIdx >= 0 && results[selectedIdx]) {
        router.push(results[selectedIdx].href);
        setQuery("");
        setResults([]);
        setSearchOpen(false);
      } else {
        router.push(`/sok?q=${encodeURIComponent(query)}`);
        setResults([]);
        setSearchOpen(false);
      }
    } else if (e.key === "Escape") {
      setResults([]);
      setSearchOpen(false);
      inputRef.current?.blur();
    }
  }

  function goToFullSearch() {
    router.push(`/sok?q=${encodeURIComponent(query)}`);
    setQuery("");
    setResults([]);
    setSearchOpen(false);
  }

  const typeBadge: Record<string, { label: string; bg: string; text: string }> = {
    club: { label: "Klubb", bg: "bg-forest-light", text: "text-forest-mid" },
    profile: { label: "Person", bg: "bg-forest-light", text: "text-forest-mid" },
    listing: { label: "Utstyr", bg: "bg-amber-light", text: "text-amber" },
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Logo variant="light" className="text-2xl" />
          </Link>

          {/* Desktop search */}
          <div className="hidden md:block flex-1 max-w-md mx-4" ref={dropdownRef}>
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Søk utstyr, klubber, personer..."
                aria-label="Søk på Sportsbytte"
                className="w-full rounded-lg border border-border bg-white pl-10 pr-16 py-2 text-sm placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-cream px-1.5 py-0.5 text-[10px] font-medium text-ink-light">
                ⌘K
              </kbd>

              {/* Quick results dropdown */}
              {searchOpen && query.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50">
                  {loading && (
                    <div className="flex items-center justify-center py-6">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest border-r-transparent" />
                    </div>
                  )}

                  {!loading && results.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-ink-light">
                      Ingen resultater for &ldquo;{query}&rdquo;
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="py-2">
                      {results.map((r, i) => (
                        <Link
                          key={`${r.type}-${r.id}`}
                          href={r.href}
                          onClick={() => {
                            setQuery("");
                            setResults([]);
                            setSearchOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-[120ms] ${
                            selectedIdx === i
                              ? "bg-forest-light"
                              : "hover:bg-cream"
                          }`}
                        >
                          {r.type === "club" && (
                            <div
                              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold"
                              style={{ backgroundColor: r.color }}
                            >
                              {r.avatar}
                            </div>
                          )}
                          {r.type === "profile" && (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-forest-light text-forest text-[10px] font-bold">
                              {r.avatar}
                            </div>
                          )}
                          {r.type === "listing" && (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-light text-amber">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-ink truncate">
                              {r.title}
                            </p>
                            <p className="text-[13px] text-ink-light truncate">
                              {r.subtitle}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 rounded-[20px] px-2 py-0.5 ${typeBadge[r.type].bg} ${typeBadge[r.type].text}`}>
                            {typeBadge[r.type].label}
                          </span>
                        </Link>
                      ))}

                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={goToFullSearch}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-forest font-medium hover:bg-cream transition-colors duration-[120ms]"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                          </svg>
                          Vis alle resultater for &ldquo;{query}&rdquo;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
            <Link
              href="/utforsk"
              className={`text-sm font-medium transition-colors duration-[120ms] ${pathname.startsWith("/utforsk") ? "text-forest font-semibold" : "text-ink-mid hover:text-forest"}`}
            >
              Utforsk
            </Link>
            <Link
              href="/klubber"
              className={`text-sm font-medium transition-colors duration-[120ms] ${pathname.startsWith("/klubber") || pathname.startsWith("/klubb") ? "text-forest font-semibold" : "text-ink-mid hover:text-forest"}`}
            >
              Klubber
            </Link>
            <Link
              href="/selg"
              onClick={handleSelgClick}
              className={`text-sm font-medium transition-colors duration-[120ms] ${pathname === "/selg" ? "text-forest font-semibold" : "text-ink-mid hover:text-forest"}`}
            >
              Selg
            </Link>

            {userName ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-cream transition-colors duration-[120ms]"
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-forest text-white text-xs font-bold">
                    {userName.slice(0, 1).toUpperCase()}
                    {hasNewMessages && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
                    )}
                  </span>
                  <span className="max-w-[100px] truncate">{userName}</span>
                  <svg className="h-3.5 w-3.5 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white border border-border shadow-lg overflow-hidden z-50">
                    <Link
                      href="/dashboard?tab=profil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-ink hover:bg-cream transition-colors duration-[120ms]"
                    >
                      <svg className="h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      Min side
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => { setUserMenuOpen(false); setHasNewMessages(false); }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-ink hover:bg-cream transition-colors duration-[120ms] border-t border-border"
                    >
                      <svg className="h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      <span className="flex-1">Innboks</span>
                      {hasNewMessages && (
                        <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                      )}
                    </Link>
                    <div className="border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                      </svg>
                      Logg ut
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="text-sm font-medium text-ink-mid hover:text-forest transition-colors duration-[120ms]"
              >
                Logg inn
              </button>
            )}
            <Link
              href="/registrer-klubb"
              className="rounded-lg bg-forest px-5 py-2 text-sm font-medium text-white hover:bg-forest-mid transition-colors duration-[120ms]"
            >
              Registrer klubb
            </Link>
          </nav>

          {/* Mobile: search + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => {
                setSearchOpen(!searchOpen);
                setMenuOpen(false);
              }}
              className="p-2 text-forest"
              aria-label="Søk"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            <button
              className="p-2 text-forest"
              onClick={() => {
                setMenuOpen(!menuOpen);
                setSearchOpen(false);
              }}
              aria-label="Åpne meny"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                router.push(`/sok?q=${encodeURIComponent(query.trim())}`);
                setSearchOpen(false);
                setQuery("");
              }
            }}
          >
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Søk utstyr, klubber, personer..."
                aria-label="Søk på Sportsbytte"
                autoFocus
                className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>
          </form>
        </div>
      )}

      {/* Login modal */}
      {loginOpen && (
        <LoginModal
          onClose={() => { setLoginOpen(false); setPendingSelg(false); }}
          onSuccess={() => {
            if (pendingSelg) {
              setPendingSelg(false);
              router.push("/selg");
            }
          }}
        />
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="px-4 py-3">
            {[
              {
                href: "/utforsk",
                label: "Utforsk utstyr",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                ),
              },
              {
                href: "/klubber",
                label: "Klubber",
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                ),
              },
              {
                href: "/selg",
                label: "Selg utstyr",
                onClick: handleSelgClick,
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                ),
              },
            ].map(({ href, label, icon, onClick }) => {
              const isActive = href === "/selg" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => { setMenuOpen(false); onClick?.(e); }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-[120ms] ${isActive ? "bg-forest-light text-forest font-semibold" : "text-ink-mid hover:bg-cream hover:text-forest"}`}
                >
                  <span className={isActive ? "text-forest" : "text-ink-light"}>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-2">
            {userName ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => { setMenuOpen(false); setHasNewMessages(false); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-mid hover:bg-cream hover:text-forest transition-colors duration-[120ms]"
                >
                  <svg className="h-5 w-5 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <span className="flex-1">Innboks</span>
                  {hasNewMessages && <span className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
                </Link>
                <Link
                  href="/dashboard?tab=profil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-mid hover:bg-cream hover:text-forest transition-colors duration-[120ms]"
                >
                  <svg className="h-5 w-5 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Min side
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="flex items-center justify-center gap-2 w-full rounded-lg border border-border px-5 py-3 text-sm font-semibold text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" />
                  </svg>
                  Logg ut
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); setLoginOpen(true); }}
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-border px-5 py-3 text-sm font-semibold text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Logg inn
              </button>
            )}
            <Link
              href="/registrer-klubb"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]"
              onClick={() => setMenuOpen(false)}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Registrer din klubb
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
