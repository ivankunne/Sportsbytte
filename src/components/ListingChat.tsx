"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ListingWithRelations } from "@/lib/queries";
import type { Json } from "@/lib/database.types";
import { AuthForm } from "./AuthForm";

type Phase = "checking" | "auth" | "ready" | "chat";

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
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [openingMsg, setOpeningMsg] = useState("");

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const defaultOpeningMsg = useCallback(
    () =>
      `Hei! Jeg er interessert i "${listing.title}" til ${listing.price.toLocaleString("nb-NO")} kr. Er den fortsatt tilgjengelig?`,
    [listing.title, listing.price]
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const el = messagesContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 60);
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
        .maybeSingle();

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

  async function afterAuth({ name, email }: { name: string; email: string }) {
    setCurrentUser({ name, email });

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
      .eq("buyer_email", email)
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
        .maybeSingle();

      if (error) throw error;
      if (!conv) throw new Error("Failed to create conversation");

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
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  }

  async function handleImageSend(file: File) {
    if (!conversation) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Bildet er for stort — maks 5 MB.");
      return;
    }
    setImageUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${conversation.id}/${Date.now()}.${ext}`;
      const { data: uploaded, error: uploadErr } = await supabase.storage
        .from("chat-images")
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage
        .from("chat-images")
        .getPublicUrl(uploaded.path);
      await sendMessage(publicUrl, "image");
    } catch {
      alert("Kunne ikke laste opp bildet. Prøv igjen.");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
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
        .maybeSingle();

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
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-5">
              <h2 className="font-display text-xl font-bold text-ink">
                Logg inn for å sende melding
              </h2>
              <p className="mt-1 text-sm text-ink-light">
                Du får svar direkte i denne samtalen.
              </p>
            </div>
            <AuthForm onSuccess={afterAuth} />
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
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
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
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Text input */}
            <div className="px-4 py-3 border-t border-border flex gap-2 items-center flex-shrink-0">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSend(file);
                }}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading || sending}
                title="Send bilde"
                className="h-9 w-9 flex-shrink-0 rounded-full border border-border flex items-center justify-center text-ink-light hover:text-forest hover:border-forest transition-colors disabled:opacity-40"
              >
                {imageUploading ? (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-forest border-t-transparent animate-spin" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                )}
              </button>
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
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
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
}: {
  message: Message;
  listingPrice: number;
}) {
  const isMe = !message.is_from_seller;

  if (message.type === "image") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <a href={message.content} target="_blank" rel="noopener noreferrer" className="block max-w-[70%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.content}
            alt="Bilde"
            className={`rounded-2xl object-cover max-h-64 w-auto border border-border ${isMe ? "rounded-br-sm" : "rounded-bl-sm"}`}
          />
        </a>
      </div>
    );
  }

  if (message.type === "bring_request") {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="rounded-2xl border border-border bg-white p-4 max-w-[75%]">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-[#CC0000] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <span className="text-xs font-bold text-[#CC0000] uppercase tracking-wide">Bring frakt</span>
          </div>
          <p className="text-sm text-ink whitespace-pre-line">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.type === "offer") {
    try {
      const data = JSON.parse(message.content) as { offer_id: number; amount: number; note?: string | null };
      return (
        <div className="flex justify-end">
          <div className="rounded-2xl border-2 border-amber/40 bg-amber-light px-4 py-3 max-w-[80%]">
            <p className="text-[10px] font-bold text-amber-dark uppercase tracking-wider mb-1">Bud sendt</p>
            <p className="text-xl font-bold text-forest">{data.amount.toLocaleString("nb-NO")} kr</p>
            {data.note && <p className="text-xs text-ink-mid mt-1 italic">&ldquo;{data.note}&rdquo;</p>}
            <p className="text-xs text-amber-dark/60 mt-1.5">Venter på svar fra selger...</p>
          </div>
        </div>
      );
    } catch {}
  }

  if (message.type === "offer_accepted") {
    try {
      const data = JSON.parse(message.content) as { amount: number };
      return (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-forest/30 bg-forest-light px-4 py-3 max-w-[80%]">
            <p className="text-sm font-bold text-forest">✓ Bud akseptert!</p>
            <p className="text-xs text-forest/70 mt-0.5">
              Budet på {data.amount.toLocaleString("nb-NO")} kr ble akseptert. Avtal overlevering her i chatten.
            </p>
          </div>
        </div>
      );
    } catch {}
  }

  if (message.type === "offer_declined") {
    return (
      <div className="flex justify-start">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 max-w-[80%]">
          <p className="text-sm font-semibold text-red-600">Bud avslått</p>
          <p className="text-xs text-red-500/70 mt-0.5">Selgeren avslo budet.</p>
        </div>
      </div>
    );
  }

  if (message.type === "offer_countered") {
    try {
      const data = JSON.parse(message.content) as { counter_amount: number };
      return (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 max-w-[80%]">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Motbud fra selger</p>
            <p className="text-xl font-bold text-blue-800">{data.counter_amount.toLocaleString("nb-NO")} kr</p>
            <p className="text-xs text-blue-600/60 mt-1">Svar i chatten om du aksepterer.</p>
          </div>
        </div>
      );
    } catch {}
  }

  if (message.type === "offer_retracted") {
    return (
      <div className="flex justify-end">
        <div className="rounded-2xl border border-border bg-cream px-4 py-2 max-w-[80%]">
          <p className="text-xs text-ink-light italic">Bud trukket tilbake</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-[75%] text-sm leading-relaxed ${
          isMe ? "bg-forest text-white rounded-br-sm" : "bg-cream text-ink rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
