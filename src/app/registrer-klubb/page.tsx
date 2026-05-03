"use client";

declare global { interface Window { dataLayer?: Record<string, unknown>[]; } }

import { useState, Suspense, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { contrastColor } from "@/lib/color";

type Plan = "free" | "pro";

function RegisterClubPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proSuccess = searchParams.get("pro") === "pending";

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1
  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [orgNumber, setOrgNumber] = useState("");

  // Step 2
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  // Step 3
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#1a3c2e");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [description, setDescription] = useState("");

  // Step 4
  const [plan, setPlan] = useState<Plan>("free");

  function validate(step: number): boolean {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!clubName.trim()) e.clubName = "Klubbnavn er påkrevd";
      if (!sport) e.sport = "Velg en aktivitet";
      if (!location.trim()) e.location = "Sted er påkrevd";
    }
    if (step === 2) {
      if (!firstName.trim()) e.firstName = "Fornavn er påkrevd";
      if (!lastName.trim()) e.lastName = "Etternavn er påkrevd";
      if (!email.trim()) e.email = "E-post er påkrevd";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Ugyldig e-postadresse";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (validate(step)) {
      window.dataLayer?.push({ event: "club_registration_step", step_completed: step, step_name: STEPS[step - 1]?.label });
      setStep(step + 1);
    }
  }

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `club-logos/pending_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { upsert: true });
    if (error) { setLogoPreview(""); setLogoUploading(false); return; }
    const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(data.path);
    setLogoUrl(urlData.publicUrl);
    setLogoUploading(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/register-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName, sport, location, memberCount, orgNumber,
          firstName, lastName, email, phone, role,
          logoUrl, primaryColor, secondaryColor, description, plan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sending feilet");

      if (plan === "pro" && data.checkoutUrl) {
        window.dataLayer?.push({ event: "club_registration_submitted", plan: "pro", club_name: clubName, sport });
        router.push(data.checkoutUrl);
      } else {
        window.dataLayer?.push({ event: "club_registration_submitted", plan: "free", club_name: clubName, sport });
        setSubmitted(true);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.");
    }
    setSubmitting(false);
  }

  if (proSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-light">
          <svg className="h-10 w-10 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">Betaling mottatt!</h1>
        <p className="mt-3 text-ink-mid leading-relaxed">
          Søknaden og Pro-betalingen din er bekreftet. Vi setter opp klubben din og aktiverer Pro så snart søknaden er godkjent — vanligvis innen <strong>24 timer</strong>.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/" className="rounded-lg bg-amber px-6 py-3 text-sm font-semibold text-white hover:brightness-95 transition-colors duration-[120ms] text-center">Tilbake til forsiden</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-light">
          <svg className="h-10 w-10 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">Søknad mottatt!</h1>
        <p className="mt-3 text-ink-mid leading-relaxed">
          Takk for at du vil registrere <strong>{clubName}</strong> på Sportsbytte.
          Vi setter opp siden og tar kontakt innen <strong>24 timer</strong>.
        </p>
        <div className="mt-8 rounded-2xl bg-forest-light border border-forest/10 p-6 text-left space-y-3">
          {["Klubbsiden settes opp og tilpasses", "Du får tilgang til admin-panelet", "Vi hjelper deg med å invitere de første medlemmene"].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <svg className="h-5 w-5 text-forest flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-ink">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/" className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] text-center">Tilbake til forsiden</Link>
          <Link href="/utforsk" className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-ink hover:bg-cream transition-colors duration-[120ms] text-center">Utforsk annonser mens du venter</Link>
        </div>
      </div>
    );
  }

  const inputCls = (field?: string) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest ${
      field && errors[field] ? "border-red-400 bg-red-50" : "border-border"
    }`;
  const selectCls = (field?: string) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest ${
      field && errors[field] ? "border-red-400 bg-red-50" : "border-border"
    }`;
  const fieldErr = (field: string) =>
    errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]}</p> : null;

  const STEPS = [
    { n: 1, label: "Klubbinfo" },
    { n: 2, label: "Kontakt" },
    { n: 3, label: "Tilpass" },
    { n: 4, label: "Plan" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-amber uppercase tracking-wider">Kom i gang</span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">Registrer din klubb</h1>
        <p className="mt-3 text-ink-mid max-w-lg mx-auto">
          Gi klubbens medlemmer en egen markedsplass for brukt utstyr. Gratis å sette opp, ingen bindingstid.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-[120ms] ${step > n ? "bg-forest text-white" : step === n ? "bg-forest text-white ring-4 ring-forest/20" : "bg-border text-ink-light"}`}>
                {step > n ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : n}
              </span>
              <span className={`text-sm font-medium hidden sm:block ${step >= n ? "text-ink" : "text-ink-light"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 sm:w-12 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Om klubben</h2>
            <div>
              <label htmlFor="club-name" className="block text-sm font-medium text-ink mb-1.5">Klubbnavn <span className="text-red-400">*</span></label>
              <input id="club-name" type="text" value={clubName} onChange={(e) => { setClubName(e.target.value); setErrors((p) => ({ ...p, clubName: "" })); }} placeholder="F.eks. Bergen Skiklubb" className={inputCls("clubName")} />
              {fieldErr("clubName")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-ink mb-1.5">Idrett / Aktivitet <span className="text-red-400">*</span></label>
                <select id="sport" value={sport} onChange={(e) => { setSport(e.target.value); setErrors((p) => ({ ...p, sport: "" })); }} className={selectCls("sport")}>
                  <option value="">Velg aktivitet</option>
                  {["Ski / Alpint", "Klatring", "Sykkel", "Løping", "Friluftsliv", "Fotball", "Håndball", "Svømming", "Tennis", "Annet"].map((s) => <option key={s}>{s}</option>)}
                </select>
                {fieldErr("sport")}
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-ink mb-1.5">Sted <span className="text-red-400">*</span></label>
                <input id="location" type="text" value={location} onChange={(e) => { setLocation(e.target.value); setErrors((p) => ({ ...p, location: "" })); }} placeholder="F.eks. Bergen" className={inputCls("location")} />
                {fieldErr("location")}
              </div>
            </div>
            <div>
              <label htmlFor="members" className="block text-sm font-medium text-ink mb-1.5">Ca. antall medlemmer</label>
              <select id="members" value={memberCount} onChange={(e) => setMemberCount(e.target.value)} className={selectCls()}>
                <option value="">Velg</option>
                {["Under 100", "100–300", "300–500", "500–1000", "Over 1000"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="org-number" className="block text-sm font-medium text-ink mb-1.5">Organisasjonsnummer <span className="font-normal text-ink-light">(valgfritt)</span></label>
              <input id="org-number" type="text" value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} placeholder="9 siffer fra Brønnøysundregistrene" className={inputCls()} />
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Kontaktperson</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-ink mb-1.5">Fornavn <span className="text-red-400">*</span></label>
                <input id="first-name" type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: "" })); }} className={inputCls("firstName")} />
                {fieldErr("firstName")}
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-ink mb-1.5">Etternavn <span className="text-red-400">*</span></label>
                <input id="last-name" type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: "" })); }} className={inputCls("lastName")} />
                {fieldErr("lastName")}
              </div>
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-ink mb-1.5">E-post <span className="text-red-400">*</span></label>
              <input id="contact-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }} placeholder="din@epost.no" className={inputCls("email")} />
              {fieldErr("email")}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink mb-1.5">Telefon <span className="font-normal text-ink-light">(valgfritt)</span></label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+47" className={inputCls()} />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-ink mb-1.5">Din rolle i klubben</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectCls()}>
                <option value="">Velg rolle</option>
                {["Lagleder / Styreleder", "Trener", "Styremedlem", "Frivillig", "Medlem"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-ink">Tilpass klubbsiden <span className="text-base font-normal text-ink-light">(valgfritt)</span></h2>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-ink mb-3">Klubblogo</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-border" style={{ backgroundColor: logoPreview ? "transparent" : primaryColor }}>
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <svg className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )}
                </div>
                <div className="space-y-2">
                  <label className={`inline-flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors duration-[120ms] ${logoUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-cream"}`}>
                    <svg className="h-4 w-4 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    {logoUploading ? "Laster opp..." : logoPreview ? "Bytt logo" : "Last opp logo"}
                    <input type="file" accept="image/*" className="sr-only" disabled={logoUploading} onChange={handleLogoUpload} />
                  </label>
                  {logoPreview && (
                    <button type="button" onClick={() => { setLogoPreview(""); setLogoUrl(""); }} className="block text-xs text-ink-light hover:text-red-500 transition-colors duration-[120ms]">Fjern logo</button>
                  )}
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Primærfarge</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#1a3c2e" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Sekundærfarge <span className="font-normal text-ink-light">(valgfritt)</span></label>
                <div className="flex items-center gap-3">
                  <input type="color" value={secondaryColor || primaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
                  <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} placeholder="Tomt = primærfarge" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
                  {secondaryColor && (
                    <button type="button" onClick={() => setSecondaryColor("")} className="text-xs text-ink-light hover:text-red-500 transition-colors flex-shrink-0">Nullstill</button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="text-xs font-semibold text-ink-light uppercase tracking-wider mb-2">Forhåndsvisning</p>
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                  <div className="h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/30" style={{ backgroundColor: secondaryColor || primaryColor }}>
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">{(clubName || "K").slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-white font-display font-bold truncate">{clubName || "Klubbnavnet ditt"}</span>
                  <button type="button" className="ml-auto rounded-lg px-4 py-1.5 text-xs font-semibold flex-shrink-0" style={{ backgroundColor: secondaryColor || "#e8843a", color: contrastColor(secondaryColor || "#e8843a") }}>Bli med</button>
                </div>
                <div className="bg-white px-5 py-2.5">
                  <p className="text-xs text-ink-light">Slik ser klubbsiden ut for besøkende</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">Kort beskrivelse av klubben</label>
              <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fortell litt om klubben, aktiviteter, og hvorfor dere vil bruke Sportsbytte..." className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none" />
            </div>
          </div>
        )}

        {/* ── Step 4: Plan ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Velg plan</h2>
              <p className="text-sm text-ink-light mt-1">Du kan oppgradere eller nedgradere når som helst.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Free */}
              <button
                type="button"
                onClick={() => setPlan("free")}
                className={`rounded-xl border-2 p-5 text-left transition-all duration-[120ms] ${plan === "free" ? "border-forest bg-forest-light" : "border-border hover:border-forest/40"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-lg font-semibold text-ink">Gratis</span>
                  {plan === "free" && <span className="rounded-full bg-forest px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">Valgt</span>}
                </div>
                <p className="text-2xl font-bold text-ink font-display">0 kr<span className="text-sm font-normal text-ink-light"> /mnd</span></p>
                <p className="text-xs text-ink-light mt-0.5 mb-4">+ 5 % transaksjonsgebyr</p>
                <ul className="space-y-2">
                  {["Klubbside med logo og farger", "Invitasjonslenker + QR-kode", "CSV-import (maks 20 per gang)", "Analysetavle for admin"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink-light">
                      <svg className="h-4 w-4 text-forest flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>

              {/* Pro */}
              <button
                type="button"
                onClick={() => setPlan("pro")}
                className={`rounded-xl border-2 p-5 text-left transition-all duration-[120ms] ${plan === "pro" ? "border-amber bg-amber-light" : "border-border hover:border-amber/40"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-lg font-semibold text-ink">Pro</span>
                  {plan === "pro" && <span className="rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">Valgt</span>}
                </div>
                <p className="text-2xl font-bold text-ink font-display">499 kr<span className="text-sm font-normal text-ink-light"> /mnd</span></p>
                <p className="text-xs text-ink-light mt-0.5 mb-4">+ kun 2 % transaksjonsgebyr</p>
                <ul className="space-y-2">
                  {["Alt i Gratis-planen", "Redusert gebyr: 2 % (vs. 5 %)", "Prioritert synlighet på /klubber", "Ubegrenset CSV-import"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink-light">
                      <svg className="h-4 w-4 text-amber flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            </div>

            {plan === "pro" && (
              <p className="text-xs text-ink-light bg-amber-light rounded-lg px-4 py-3 border border-amber/20">
                Du blir videresendt til sikker betaling via Stripe etter registrering. Abonnementet starter umiddelbart.
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="text-sm font-medium text-ink-light hover:text-ink transition-colors duration-[120ms]">← Tilbake</button>
          ) : <div />}

          {step < 4 ? (
            <button onClick={goNext} className="rounded-lg bg-forest px-7 py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]">
              Neste steg →
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {submitError && <p className="text-xs text-red-600">{submitError}</p>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`rounded-lg px-7 py-2.5 text-sm font-bold text-white hover:brightness-95 transition-colors duration-[120ms] disabled:opacity-50 ${plan === "pro" ? "bg-amber" : "bg-forest hover:bg-forest-mid"}`}
              >
                {submitting
                  ? (plan === "pro" ? "Åpner betaling..." : "Sender...")
                  : plan === "pro"
                  ? "Registrer og betal for Pro →"
                  : "Registrer klubben"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: "Gratis oppstart", desc: "Ingen kostnad for å sette opp klubbsiden. Betal kun for Pro-funksjoner." },
          { title: "Klar på minutter", desc: "Vi setter opp alt. Del lenken med medlemmene og kom i gang med en gang." },
          { title: "Støtte hele veien", desc: "Dedikert kontaktperson hjelper deg med oppsett og lansering i klubben." },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <h3 className="font-display text-lg font-semibold text-ink">{item.title}</h3>
            <p className="mt-1 text-sm text-ink-mid">{item.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-ink-light">
        Har du spørsmål? <Link href="/kontakt" className="text-forest hover:underline">Ta kontakt</Link> — vi svarer innen 24 timer.
      </p>
    </div>
  );
}

export default function RegisterClubPage() {
  return (
    <Suspense>
      <RegisterClubPageInner />
    </Suspense>
  );
}
