"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { showSuccess, showError } from "@/components/Toaster";

type Tab = "innboks" | "annonser" | "anmeldelser" | "profil";

type UserProfile = {
  id: number;
  name: string;
  bio: string;
  avatar: string;
  avatar_url: string | null;
  club_id: number | null;
  total_sold: number;
  rating: number;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  is_pro: boolean;
  stripe_subscription_id: string | null;
};

type ConvListing = { id: number; title: string; price: number };

type Conversation = {
  id: string;
  listing_id: number;
  seller_id: number;
  buyer_name: string;
  buyer_email: string;
  created_at: string;
  listings: ConvListing | null;
  role: "seller" | "buyer";
};

type Message = {
  id: string;
  conversation_id: string;
  is_from_seller: boolean;
  type: string;
  content: string;
  created_at: string;
};

type MyListing = {
  id: number;
  title: string;
  price: number;
  category: string;
  condition: string;
  is_sold: boolean;
  is_boosted: boolean;
  boosted_until: string | null;
  views: number;
  images: string[];
  created_at: string;
};

// ─── Page ────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "innboks";
  const [tab, setTab] = useState<Tab>(initialTab);
  const stripeReturn = searchParams.get("stripe");
  const proReturn = searchParams.get("pro");
  const boostReturn = searchParams.get("boost");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) { router.push("/"); return; }
      setUserEmail(session.user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
      if (!mounted) return;
      setProfile(p as UserProfile ?? null);
      setLoading(false);
      localStorage.setItem("dashboard_last_visited", new Date().toISOString());
      if (stripeReturn === "success") {
        showSuccess("Stripe-oppsett fullført! Kortbetaling er nå aktivert på annonser dine.");
      } else if (stripeReturn === "refresh") {
        showError("Stripe-oppsett ikke fullført. Prøv igjen.");
      } else if (proReturn === "success") {
        showSuccess("Velkommen som Selger Pro! Du betaler nå kun 2% gebyr på salg.");
      } else if (boostReturn === "success") {
        showSuccess("Annonsen er nå fremhevet i 7 dager!");
      }
    }

    loadProfile();

    // Also listen for sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/");
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router, stripeReturn, proReturn, boostReturn]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }


  if (!profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-ink-light">Ingen profil funnet.</p>
        <Link href="/" className="text-sm font-medium text-forest hover:underline">Til forsiden</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          God dag, {profile.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-light mt-0.5">{userEmail}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {([
          { id: "innboks" as Tab, label: "Innboks" },
          { id: "annonser" as Tab, label: "Mine annonser" },
          { id: "anmeldelser" as Tab, label: "Anmeldelser" },
          { id: "profil" as Tab, label: "Profil" },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-[120ms] border-b-2 -mb-px ${
              tab === t.id
                ? "border-forest text-forest"
                : "border-transparent text-ink-light hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "innboks" && (
        <InboksTab profile={profile} userEmail={userEmail} />
      )}
      {tab === "annonser" && <AnnonserTab profile={profile} />}
      {tab === "anmeldelser" && <AnmedelserTab profile={profile} />}
      {tab === "profil" && (
        <ProfilTab
          profile={profile}
          onSave={(updated) => setProfile((p) => (p ? { ...p, ...updated } : p))}
        />
      )}
    </div>
  );
}

// ─── Innboks ─────────────────────────────────────────────

function InboksTab({
  profile,
  userEmail,
}: {
  profile: UserProfile;
  userEmail: string;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: sellerConvs }, { data: buyerConvs }] = await Promise.all([
        supabase
          .from("conversations")
          .select("*, listings(id, title, price)")
          .eq("seller_id", profile.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("conversations")
          .select("*, listings(id, title, price)")
          .eq("buyer_email", userEmail)
          .neq("seller_id", profile.id)
          .order("created_at", { ascending: false }),
      ]);

      const normalize = (c: unknown): Conversation => {
        const conv = c as Record<string, unknown>;
        return {
          ...(conv as unknown as Conversation),
          listings: Array.isArray(conv.listings)
            ? (conv.listings as ConvListing[])[0] ?? null
            : (conv.listings as ConvListing | null),
        };
      };

      const all: Conversation[] = [
        ...((sellerConvs ?? []) as unknown[]).map((c) => ({
          ...normalize(c),
          role: "seller" as const,
        })),
        ...((buyerConvs ?? []) as unknown[]).map((c) => ({
          ...normalize(c),
          role: "buyer" as const,
        })),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setConversations(all);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, [profile.id, userEmail]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto h-10 w-10 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <p className="text-ink-light text-sm">Ingen samtaler ennå.</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: show conversation list unless one is selected */}
      <div className={`md:hidden ${selected ? "hidden" : "block"} space-y-2`}>
        {conversations.map((conv) => (
          <ConvListItem
            key={conv.id}
            conv={conv}
            selected={false}
            onClick={() => setSelected(conv)}
          />
        ))}
      </div>

      {/* Mobile: selected conversation */}
      {selected && (
        <div className="md:hidden flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-sm text-forest font-medium mb-3"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Tilbake
          </button>
          <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden flex flex-col">
            <ConversationView
              key={selected.id}
              conversation={selected}
              isSeller={selected.role === "seller"}
            />
          </div>
        </div>
      )}

      {/* Desktop: split view */}
      <div className="hidden md:grid md:grid-cols-3 gap-4" style={{ height: 580 }}>
        <div className="col-span-1 overflow-y-auto space-y-1.5 pr-1">
          {conversations.map((conv) => (
            <ConvListItem
              key={conv.id}
              conv={conv}
              selected={selected?.id === conv.id}
              onClick={() => setSelected(conv)}
            />
          ))}
        </div>
        <div className="col-span-2 bg-white rounded-xl border border-border overflow-hidden flex flex-col">
          {selected ? (
            <ConversationView
              key={selected.id}
              conversation={selected}
              isSeller={selected.role === "seller"}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-ink-light">Velg en samtale</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ConvListItem({
  conv,
  selected,
  onClick,
}: {
  conv: Conversation;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-3.5 transition-colors duration-[120ms] ${
        selected
          ? "bg-forest-light border-2 border-forest"
          : "bg-white border-2 border-transparent hover:border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink truncate">
          {conv.listings?.title ?? "Ukjent annonse"}
        </p>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 rounded-full px-2 py-0.5 ${
            conv.role === "seller"
              ? "bg-amber-light text-amber"
              : "bg-forest-light text-forest"
          }`}
        >
          {conv.role === "seller" ? "Selger" : "Kjøper"}
        </span>
      </div>
      <p className="text-xs text-ink-light mt-1 truncate">
        {conv.role === "seller" ? `Kjøper: ${conv.buyer_name}` : "Samtale med selger"}
      </p>
      <p className="text-xs font-medium text-forest mt-0.5">
        {conv.listings?.price?.toLocaleString("nb-NO")} kr
      </p>
    </button>
  );
}

function ConversationView({
  conversation,
  isSeller,
}: {
  conversation: Conversation;
  isSeller: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      60
    );
  }, []);

  useEffect(() => {
    setLoadingMsgs(true);
    setLoadError("");
    let mounted = true;

    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        setLoadingMsgs(false);
        if (error) {
          setLoadError(`Kunne ikke laste meldinger: ${error.message}`);
          return;
        }
        setMessages((data ?? []) as Message[]);
        scrollToBottom();
      });

    // Unique name per mount avoids the "already subscribed" error from
    // React StrictMode double-invoking effects before cleanup completes.
    const channel = supabase
      .channel(`dash:${conversation.id}:${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          if (!mounted) return;
          setMessages((prev) => {
            if (prev.find((m) => m.id === (payload.new as Message).id))
              return prev;
            return [...prev, payload.new as Message];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [conversation.id, scrollToBottom]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    const draft = text.trim();
    setText("");
    setSending(true);
    setSendError("");
    try {
      const { data: msg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          is_from_seller: isSeller,
          type: "text",
          content: draft,
        })
        .select()
        .maybeSingle();

      if (error) {
        setSendError(`Kunne ikke sende: ${error.message}`);
        setText(draft);
        return;
      }

      if (msg) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === (msg as Message).id)) return prev;
          return [...prev, msg as Message];
        });
        scrollToBottom();
      }
    } catch (e) {
      setSendError("Noe gikk galt. Prøv igjen.");
      setText(draft);
    } finally {
      setSending(false);
    }
  }

  const listingObj = Array.isArray(conversation.listings)
    ? (conversation.listings as ConvListing[])[0] ?? null
    : conversation.listings;

  return (
    <>
      <div className="px-4 py-3 border-b border-border flex-shrink-0 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-ink">
            {listingObj?.title ?? "Ukjent annonse"}
          </p>
          <p className="text-xs text-ink-light">
            {isSeller
              ? `Kjøper: ${conversation.buyer_name}`
              : "Samtale med selger"}
          </p>
        </div>
        {listingObj?.id && (
          <Link
            href={`/annonse/${listingObj.id}`}
            className="text-xs text-forest hover:underline"
          >
            Se annonse →
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loadingMsgs && (
          <div className="flex items-center justify-center h-full">
            <div className="h-5 w-5 rounded-full border-2 border-forest border-t-transparent animate-spin" />
          </div>
        )}
        {loadError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-red-500 text-center px-4">{loadError}</p>
          </div>
        )}
        {!loadingMsgs && !loadError && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-ink-light">Ingen meldinger ennå.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = isSeller ? msg.is_from_seller : !msg.is_from_seller;
          const isSpecial = msg.type === "bring_request";
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-[75%] text-sm leading-relaxed ${
                  isSpecial
                    ? "bg-cream border border-border text-ink-mid italic"
                    : isMe
                    ? "bg-forest text-white rounded-br-sm"
                    : "bg-cream text-ink rounded-bl-sm"
                }`}
              >
                {msg.type === "bring_request"
                  ? "Sendte en Bring-fraktforespørsel"
                  : msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {sendError && (
        <p className="px-4 pb-1 text-xs text-red-500">{sendError}</p>
      )}

      <div className="px-4 py-3 border-t border-border flex gap-2 items-center flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Skriv en melding..."
          className="flex-1 rounded-full border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest bg-cream"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="h-9 w-9 flex-shrink-0 rounded-full bg-forest flex items-center justify-center text-white hover:bg-forest-mid transition-colors disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </>
  );
}

// ─── Mine annonser ───────────────────────────────────────

function AnnonserTab({ profile }: { profile: UserProfile }) {
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [boosting, setBoosting] = useState<number | null>(null);

  async function boostListing(listingId: number) {
    setBoosting(listingId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setBoosting(null); return; }
    const res = await fetch("/api/stripe/boost-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else { showError(json.error ?? "Noe gikk galt"); setBoosting(null); }
  }

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, price, category, condition, is_sold, is_boosted, boosted_until, views, images, created_at")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setListings((data ?? []) as MyListing[]);
        setLoading(false);
      }, () => setLoading(false));
  }, [profile.id]);

  async function toggleSold(id: number, currentSold: boolean) {
    await supabase
      .from("listings")
      .update({ is_sold: !currentSold })
      .eq("id", id)
      .eq("seller_id", profile.id);
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, is_sold: !currentSold } : l))
    );
  }

  function startEdit(listing: MyListing) {
    setEditing(listing.id);
    setEditForm({ title: listing.title, price: String(listing.price) });
  }

  async function saveEdit(id: number) {
    setEditSaving(true);
    const price = parseInt(editForm.price || "0");
    await supabase
      .from("listings")
      .update({ title: editForm.title.trim(), price })
      .eq("id", id)
      .eq("seller_id", profile.id);
    setListings((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, title: editForm.title.trim(), price } : l
      )
    );
    setEditSaving(false);
    setEditing(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto h-10 w-10 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
        <p className="text-ink-light text-sm mb-4">Du har ikke lagt ut noen annonser ennå.</p>
        <Link
          href="/selg"
          className="rounded-lg bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors"
        >
          Legg ut annonse
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-ink-light">{listings.length} annonse{listings.length !== 1 ? "r" : ""}</p>
        <Link
          href="/selg"
          className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white hover:bg-forest-mid transition-colors"
        >
          + Ny annonse
        </Link>
      </div>

      {listings.map((listing) => (
        <div key={listing.id} className="bg-white rounded-xl border border-border overflow-hidden">
          {editing === listing.id ? (
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Tittel</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Pris (kr)</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(listing.id)}
                  disabled={editSaving || !editForm.title.trim()}
                  className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editSaving ? "Lagrer..." : "Lagre"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  disabled={editSaving}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-ink-mid hover:bg-cream transition-colors disabled:opacity-40"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              {listing.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.images[0]}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
                  <svg className="h-6 w-6 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-ink truncate">{listing.title}</p>
                  <span
                    className={`text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 ${
                      listing.is_sold
                        ? "bg-red-50 text-red-500"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {listing.is_sold ? "Solgt" : "Aktiv"}
                  </span>
                </div>
                <p className="text-sm font-bold text-forest mt-0.5">
                  {listing.price.toLocaleString("nb-NO")} kr
                </p>
                <p className="text-xs text-ink-light mt-0.5">
                  {listing.category} · {listing.views} visninger
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/annonse/${listing.id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-mid hover:bg-cream transition-colors hidden sm:block"
                >
                  Se
                </Link>
                <button
                  onClick={() => startEdit(listing)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-mid hover:bg-cream transition-colors"
                >
                  Rediger
                </button>
                {!listing.is_sold && (() => {
                  const isActiveBoosted = listing.is_boosted && listing.boosted_until && new Date(listing.boosted_until) > new Date();
                  return isActiveBoosted ? (
                    <span className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700">
                      ★ Fremhevet
                    </span>
                  ) : (
                    <button
                      onClick={() => boostListing(listing.id)}
                      disabled={boosting === listing.id}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      {boosting === listing.id ? "..." : "Fremhev"}
                    </button>
                  );
                })()}
                <button
                  onClick={() => toggleSold(listing.id, listing.is_sold)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    listing.is_sold
                      ? "bg-forest text-white hover:bg-forest-mid"
                      : "bg-red-50 text-red-500 hover:bg-red-100"
                  }`}
                >
                  {listing.is_sold ? "Reaktiver" : "Solgt"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Anmeldelser ─────────────────────────────────────────

type Review = {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { name: string } | null;
};

function AnmedelserTab({ profile }: { profile: UserProfile }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(name)")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReviews((data ?? []) as unknown as Review[]);
        setLoading(false);
      }, () => setLoading(false));
  }, [profile.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-border px-5 py-4">
          <span className="text-3xl font-bold text-forest">{avg}</span>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`h-4 w-4 ${Number(avg) >= s ? "text-amber-400" : "text-border"}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-ink-light mt-0.5">{reviews.length} anmeldelse{reviews.length !== 1 ? "r" : ""}</p>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-10 w-10 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <p className="text-ink-light text-sm">Ingen anmeldelser ennå.</p>
        </div>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-border p-5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className={`h-4 w-4 ${r.rating >= s ? "text-amber-400" : "text-border"}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-ink-light">
                {r.reviewer?.name ?? "Anonym"} · {new Date(r.created_at).toLocaleDateString("nb-NO")}
              </span>
            </div>
            {r.comment && <p className="text-sm text-ink leading-relaxed">{r.comment}</p>}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Profil ──────────────────────────────────────────────

// ─── Stripe Connect card ─────────────────────────────────

function StripeConnectCard({ profile }: { profile: UserProfile }) {
  const [loading, setLoading] = useState(false);
  const [dashLoading, setDashLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "Authorization": `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else setLoading(false);
  }

  async function handleDashboard() {
    setDashLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setDashLoading(false); return; }
    const res = await fetch("/api/stripe/dashboard-link", {
      method: "POST",
      headers: { "Authorization": `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (json.url) window.open(json.url, "_blank");
    setDashLoading(false);
  }

  const isConnected = profile.stripe_account_id && profile.stripe_onboarding_complete;
  const isPending = profile.stripe_account_id && !profile.stripe_onboarding_complete;

  return (
    <div className="bg-white rounded-xl p-6">
      <h2 className="font-display text-base font-semibold text-ink mb-1">Kortbetaling</h2>
      <p className="text-xs text-ink-light mb-4">La kjøpere betale direkte med kort. Du mottar pengene direkte fra Stripe.</p>

      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-forest-light px-4 py-3">
            <svg className="h-4 w-4 text-forest flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-sm font-medium text-forest">Stripe aktivert — kjøpere kan betale med kort</span>
          </div>
          <button
            onClick={handleDashboard}
            disabled={dashLoading}
            className="w-full rounded-lg border border-border py-2.5 text-sm font-semibold text-ink hover:bg-cream transition-colors disabled:opacity-50"
          >
            {dashLoading ? "Åpner..." : "Se inntekter og utbetalinger →"}
          </button>
        </div>
      ) : isPending ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-amber-light border border-amber/30 px-4 py-3">
            <svg className="h-4 w-4 text-amber-dark flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <span className="text-sm font-medium text-amber-dark">Oppsett ikke fullført</span>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full rounded-lg border border-border py-2.5 text-sm font-semibold text-ink hover:bg-cream transition-colors disabled:opacity-50"
          >
            {loading ? "Åpner Stripe..." : "Fullfør Stripe-oppsett"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full rounded-lg bg-[#635bff] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Åpner Stripe..." : "Koble til Stripe"}
        </button>
      )}
    </div>
  );
}

// ─── Selger Pro card ─────────────────────────────────────

function SelgerProCard({ profile }: { profile: UserProfile }) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const res = await fetch("/api/stripe/seller-pro-subscribe", {
      method: "POST",
      headers: { "Authorization": `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else { showError(json.error ?? "Noe gikk galt"); setLoading(false); }
  }

  async function handleCancel() {
    if (!confirm("Er du sikker på at du vil avslutte Selger Pro?")) return;
    setCancelling(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCancelling(false); return; }
    const res = await fetch("/api/stripe/seller-pro-cancel", {
      method: "POST",
      headers: { "Authorization": `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (json.ok) {
      showSuccess("Abonnementet er avsluttet.");
      window.location.reload();
    } else {
      showError(json.error ?? "Noe gikk galt");
      setCancelling(false);
    }
  }

  return (
    <div className="bg-white rounded-xl p-6">
      <h2 className="font-display text-base font-semibold text-ink mb-1">Selger Pro</h2>
      <p className="text-xs text-ink-light mb-4">
        {profile.is_pro
          ? "Du er Pro-selger — kjøperne dine betaler kun 2% servicegebyr. Du mottar alltid fullt listebeløp."
          : "Oppgrader til Pro — kjøperne dine betaler 2% servicegebyr i stedet for 5%. 99 kr/mnd, avbryt når som helst."}
      </p>

      {profile.is_pro ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <span className="text-amber-600 font-bold text-lg">★</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Selger Pro aktiv</p>
              <p className="text-xs text-amber-700">2% servicegebyr for kjøpere · Fremhevede annonser</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink-mid hover:bg-cream transition-colors disabled:opacity-50"
          >
            {cancelling ? "Avslutter..." : "Avslutt abonnement"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Åpner betaling..." : "Bli Pro — 99 kr/mnd"}
        </button>
      )}
    </div>
  );
}

// ─── Profil ──────────────────────────────────────────────

function ProfilTab({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [form, setForm] = useState({
    name: profile.name,
    bio: profile.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `profile-avatars/${profile.id}.${ext}`;
    const { data, error: uploadErr } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { upsert: true });
    if (uploadErr) { setAvatarUploading(false); return; }
    const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(data.path);
    const newUrl = urlData.publicUrl;
    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("id", profile.id);
    setAvatarUrl(newUrl);
    onSave({ avatar_url: newUrl });
    setAvatarUploading(false);
  }

  async function save() {
    setError("");
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim(),
        bio: form.bio.trim(),
      })
      .eq("id", profile.id);

    if (err) {
      setError("Noe gikk galt. Prøv igjen.");
    } else {
      onSave({
        name: form.name.trim(),
        bio: form.bio.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="bg-white rounded-xl p-6 space-y-5">
        <h2 className="font-display text-base font-semibold text-ink">Rediger profil</h2>

        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="relative group flex-shrink-0"
          >
            <div className="h-20 w-20 rounded-full overflow-hidden bg-forest-light flex items-center justify-center text-forest font-bold text-2xl font-display ring-2 ring-border group-hover:ring-forest transition-all duration-[120ms]">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={profile.name} fill className="object-cover" />
              ) : (
                profile.avatar
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms] flex items-center justify-center">
              {avatarUploading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <p className="text-sm font-medium text-ink">Profilbilde</p>
            <p className="text-xs text-ink-light mt-0.5">Klikk på bildet for å laste opp</p>
            <p className="text-xs text-ink-light">JPG, PNG — maks 5 MB</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">Navn</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
            placeholder="Fortell litt om deg selv..."
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
          />
        </div>


        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={save}
          disabled={saving || avatarUploading || !form.name.trim()}
          className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Lagrer..." : saved ? "✓ Lagret!" : "Lagre endringer"}
        </button>
      </div>

      <StripeConnectCard profile={profile} />

      <SelgerProCard profile={profile} />

      <div className="bg-white rounded-xl p-6">
        <h2 className="font-display text-base font-semibold text-ink mb-4">Din statistikk</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-4 rounded-xl bg-cream">
            <p className="text-2xl font-bold text-forest">{profile.total_sold}</p>
            <p className="text-xs text-ink-light mt-1">Solgt totalt</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-cream">
            <p className="text-2xl font-bold text-forest">
              {profile.rating > 0 ? profile.rating.toFixed(1) : "–"}
            </p>
            <p className="text-xs text-ink-light mt-1">Snittkarakter</p>
          </div>
        </div>
      </div>
    </div>
  );
}
