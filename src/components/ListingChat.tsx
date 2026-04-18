"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations } from "@/lib/queries";
import type { Json } from "@/lib/database.types";

type Phase = "checking" | "auth" | "ready" | "chat";
type AuthMode = "login" | "signup";

type Conversation = {
  id: string;
  listing_id: number;
  seller_id: number;
  buyer_name: string;
  buyer_email: string;
  created_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  is_from_seller: boolean;
  type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const storageKey = (listingId: number) => `conv_${listingId}`;

export function ListingChat({
  listing,
  open,
  onClose,
}: {
  listing: ListingWithRelations;
  open: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [openingMsg, setOpeningMsg] = useState("");

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showBringForm, setShowBringForm] = useState(false);
  const [bringAddress, setBringAddress] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultOpeningMsg = useCallback(
    () =>
      `Hei! Jeg er interessert i "${listing.title}" til ${listing.price.toLocaleString("nb-NO")} kr. Er den fortsatt tilgjengelig?`,
    [listing.title, listing.price]
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, []);

  const loadMessages = useCallback(
    async (convId: string) => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  useEffect(() => {
    if (!open) return;

    async function init() {
      setPhase("checking");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPhase("auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("auth_user_id", session.user.id)
        .single();

      const userName =
        profile?.name ?? session.user.email?.split("@")[0] ?? "Kjøper";
      const userEmail = session.user.email ?? "";
      setCurrentUser({ name: userName, email: userEmail });

      // 1. Check localStorage (fast path)
      const stored = localStorage.getItem(storageKey(listing.id));
      if (stored) {
        try {
          const conv = JSON.parse(stored) as Conversation;
          setConversation(conv);
          setPhase("chat");
          loadMessages(conv.id);
          return;
        } catch {
          localStorage.removeItem(storageKey(listing.id));
        }
      }

      // 2. Check DB — restores conversation on new device / cleared browser
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .eq("listing_id", listing.id)
        .eq("buyer_email", userEmail)
        .maybeSingle();

      if (existingConv) {
        localStorage.setItem(storageKey(listing.id), JSON.stringify(existingConv));
        setConversation(existingConv as Conversation);
        setPhase("chat");
        loadMessages(existingConv.id);
        return;
      }

      setOpeningMsg(defaultOpeningMsg());
      setPhase("ready");
    }

    init();
  }, [open, listing.id, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
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
      supabase.removeChannel(channel);
    };
  }, [conversation, scrollToBottom]);

  async function handleAuth() {
    setAuthError("");
    setAuthLoading(true);
    try {
      let userName = "";
      let userEmail = "";

      if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email.trim(),
          password: authForm.password,
        });
        if (error) throw error;

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("auth_user_id", data.user.id)
          .single();

        userName =
          profile?.name ?? data.user.email?.split("@")[0] ?? "Kjøper";
        userEmail = data.user.email ?? "";
      } else {
        if (!authForm.name.trim()) throw new Error("Skriv inn ditt navn");
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email.trim(),
          password: authForm.password,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Registrering feilet");

        const slug =
          authForm.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") +
          "-" +
          Date.now().toString(36);

        await supabase.from("profiles").insert({
          auth_user_id: data.user.id,
          name: authForm.name.trim(),
          slug,
        });

        userName = authForm.name.trim();
        userEmail = authForm.email.trim();
      }

      setCurrentUser({ name: userName, email: userEmail });

      // Check localStorage first, then DB
      const stored = localStorage.getItem(storageKey(listing.id));
      if (stored) {
        try {
          const conv = JSON.parse(stored) as Conversation;
          setConversation(conv);
          setPhase("chat");
          loadMessages(conv.id);
          return;
        } catch {
          localStorage.removeItem(storageKey(listing.id));
        }
      }

      const { data: existingConv } = await supabase
        .from("conversations")
        .select("*")
        .eq("listing_id", listing.id)
        .eq("buyer_email", userEmail)
        .maybeSingle();

      if (existingConv) {
        localStorage.setItem(storageKey(listing.id), JSON.stringify(existingConv));
        setConversation(existingConv as Conversation);
        setPhase("chat");
        loadMessages(existingConv.id);
        return;
      }

      setOpeningMsg(defaultOpeningMsg());
      setPhase("ready");
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setAuthLoading(false);
    }
  }

  async function startConversation() {
    if (!currentUser) return;
    setStarting(true);
    try {
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({
          listing_id: listing.id,
          seller_id: listing.seller_id,
          buyer_name: currentUser.name,
          buyer_email: currentUser.email,
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem(storageKey(listing.id), JSON.stringify(conv));
      setConversation(conv as Conversation);

      await supabase.from("messages").insert({
        conversation_id: conv.id,
        is_from_seller: false,
        type: "text",
        content: openingMsg.trim() || defaultOpeningMsg(),
      });

      setPhase("chat");
      await loadMessages(conv.id);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  }

  async function sendMessage(content: string, type = "text", metadata?: Json) {
    if (!conversation || !content.trim()) return;
    setSending(true);
    try {
      const { data: msg } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          is_from_seller: false,
          type,
          content: content.trim(),
          metadata: metadata ?? null,
        })
        .select()
        .single();

      if (msg) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === (msg as Message).id)) return prev;
          return [...prev, msg as Message];
        });
        scrollToBottom();
      }
      setText("");
    } finally {
      setSending(false);
    }
  }

  async function sendVippsRequest() {
    const sellerPhone = listing.profiles?.vipps_phone;
    await sendMessage(
      `Ønsker å betale ${listing.price.toLocaleString("nb-NO")} kr med Vipps`,
      "vipps_request",
      { amount: listing.price, seller_phone: sellerPhone ?? null } as Json
    );
  }

  async function sendBringRequest() {
    if (!bringAddress.trim()) return;
    await sendMessage(
      `Ønsker å motta varen med Bring.\nLeveringsadresse: ${bringAddress.trim()}`,
      "bring_request",
      { address: bringAddress.trim() } as Json
    );
    setShowBringForm(false);
    setBringAddress("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "min(680px, 92vh)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-ink-light hover:text-ink hover:bg-cream transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-ink truncate">
              {listing.title}
            </p>
            <p className="text-xs text-ink-light">
              {listing.profiles?.name} · {listing.price.toLocaleString("nb-NO")}{" "}
              kr
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-light text-forest font-bold text-sm flex-shrink-0">
            {listing.profiles?.avatar ?? "?"}
          </div>
        </div>

        {/* ── Checking (loading) ── */}
        {phase === "checking" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-forest border-t-transparent animate-spin" />
          </div>
        )}

        {/* ── Auth screen ── */}
        {phase === "auth" && (
          <div className="flex-1 overflow-y-auto flex flex-col justify-center p-6">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-ink">
                {authMode === "login" ? "Logg inn" : "Opprett konto"}
              </h2>
              <p className="mt-1 text-sm text-ink-light">
                {authMode === "login"
                  ? "Logg inn for å sende melding til selgeren."
                  : "Registrer deg gratis for å starte samtalen."}
              </p>
            </div>

            <div className="space-y-3">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">
                    Fullt navn
                  </label>
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(e) =>
                      setAuthForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Ola Nordmann"
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  E-post
                </label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm((f) => ({ ...f, email: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="ola@example.com"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  Passord
                </label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) =>
                    setAuthForm((f) => ({ ...f, password: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              {authError && (
                <p className="text-xs text-red-500">{authError}</p>
              )}

              <button
                onClick={handleAuth}
                disabled={
                  authLoading ||
                  !authForm.email.trim() ||
                  !authForm.password ||
                  (authMode === "signup" && !authForm.name.trim())
                }
                className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading
                  ? "Laster..."
                  : authMode === "login"
                  ? "Logg inn"
                  : "Opprett konto"}
              </button>
            </div>

            <p className="mt-5 text-center text-sm text-ink-light">
              {authMode === "login" ? (
                <>
                  Har du ikke konto?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthError("");
                    }}
                    className="font-semibold text-forest hover:underline"
                  >
                    Registrer deg
                  </button>
                </>
              ) : (
                <>
                  Har du allerede konto?{" "}
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                    }}
                    className="font-semibold text-forest hover:underline"
                  >
                    Logg inn
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Ready (logged in, no conversation yet) ── */}
        {phase === "ready" && currentUser && (
          <div className="flex-1 flex flex-col justify-center p-6">
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold text-ink">
                Send melding til selger
              </h2>
              <p className="mt-1 text-sm text-ink-light">
                Du er logget inn som{" "}
                <span className="font-medium text-ink">{currentUser.name}</span>.
                Meldinger vises direkte i samtalen.
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-ink mb-1.5">
                Åpningsmelding
              </label>
              <textarea
                value={openingMsg}
                onChange={(e) => setOpeningMsg(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none bg-cream"
              />
            </div>

            <button
              onClick={startConversation}
              disabled={starting}
              className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {starting ? "Starter samtale..." : "Start samtale"}
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setCurrentUser(null);
                setAuthForm({ email: "", password: "", name: "" });
                setAuthMode("login");
                setPhase("auth");
              }}
              className="mt-3 text-center text-xs text-ink-light hover:text-ink transition-colors"
            >
              Ikke deg? Logg ut
            </button>
          </div>
        )}

        {/* ── Chat view ── */}
        {phase === "chat" && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-ink-light">Ingen meldinger ennå.</p>
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  listingPrice={listing.price}
                  sellerPhone={listing.profiles?.vipps_phone}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Bring address form */}
            {showBringForm && (
              <div className="px-4 py-3 border-t border-border bg-cream flex-shrink-0">
                <p className="text-xs font-semibold text-ink mb-2">
                  Leveringsadresse
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bringAddress}
                    onChange={(e) => setBringAddress(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && sendBringRequest()
                    }
                    placeholder="Gateveien 1, 5000 Bergen"
                    autoFocus
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                  <button
                    onClick={sendBringRequest}
                    disabled={!bringAddress.trim()}
                    className="rounded-lg bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-forest-mid transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setShowBringForm(false)}
                    className="rounded-lg border border-border px-2 py-2 text-ink-light hover:bg-cream transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Quick action buttons */}
            <div className="px-4 pt-2 pb-1 flex gap-2 flex-shrink-0 overflow-x-auto">
              <button
                onClick={sendVippsRequest}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[#FF5B24] px-4 py-1.5 hover:brightness-110 transition-all duration-[120ms]"
              >
                <span className="text-xs font-semibold text-white">
                  Betal med
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/vipps-white.png" alt="Vipps" className="h-3.5 w-auto" />
              </button>
              <button
                onClick={() => setShowBringForm((v) => !v)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink-mid hover:bg-cream transition-colors duration-[120ms]"
              >
                <svg
                  className="h-3.5 w-3.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                  />
                </svg>
                Send med Bring
              </button>
            </div>

            {/* Text input */}
            <div className="px-4 py-3 border-t border-border flex gap-2 items-center flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(text);
                  }
                }}
                placeholder="Skriv en melding..."
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest bg-cream"
              />
              <button
                onClick={() => sendMessage(text)}
                disabled={sending || !text.trim()}
                className="h-9 w-9 flex-shrink-0 rounded-full bg-forest flex items-center justify-center text-white hover:bg-forest-mid transition-colors disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  listingPrice,
  sellerPhone,
}: {
  message: Message;
  listingPrice: number;
  sellerPhone?: string | null;
}) {
  const isMe = !message.is_from_seller;

  if (message.type === "vipps_request") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="rounded-2xl bg-[#FF5B24] p-4 max-w-[75%]">
          <div className="flex items-center gap-2 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vipps-white.png" alt="Vipps" className="h-4 w-auto" />
          </div>
          <p className="text-lg font-bold text-white">
            {listingPrice.toLocaleString("nb-NO")} kr
          </p>
          <p className="text-xs text-white/70 mt-0.5">Betalingsforespørsel</p>
          {sellerPhone && (
            <a
              href={`https://qr.vipps.no/28/2/01/031/${sellerPhone}?v=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block w-full text-center text-xs font-semibold bg-white/20 rounded-lg py-2 hover:bg-white/30 transition-colors text-white"
            >
              Åpne i Vipps →
            </a>
          )}
        </div>
      </div>
    );
  }

  if (message.type === "bring_request") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="rounded-2xl border border-border bg-white p-4 max-w-[75%]">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-4 w-4 text-[#CC0000] flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
              />
            </svg>
            <span className="text-xs font-bold text-[#CC0000] uppercase tracking-wide">
              Bring frakt
            </span>
          </div>
          <p className="text-sm text-ink whitespace-pre-line">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-[75%] text-sm leading-relaxed ${
          isMe
            ? "bg-forest text-white rounded-br-sm"
            : "bg-cream text-ink rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
