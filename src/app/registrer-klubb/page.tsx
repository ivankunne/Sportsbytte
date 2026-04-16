"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegisterClubPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    if (error) {
      setLogoPreview("");
      setLogoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("listing-images")
      .getPublicUrl(data.path);
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
          logoUrl, primaryColor, secondaryColor, description,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Sending feilet");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.");
    }
    setSubmitting(false);
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
          Takk for at du vil registrere klubben din på Sportsbyttet. Vi setter opp siden
          og tar kontakt innen <strong>24 timer</strong> på e-posten du oppgav.
        </p>
        <div className="mt-8 rounded-2xl bg-forest-light border border-forest/10 p-6 text-left space-y-3">
          {[
            "Klubbsiden settes opp og tilpasses",
            "Du får tilgang til admin-panelet",
            "Vi hjelper deg med å invitere de første medlemmene",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <svg className="h-5 w-5 text-forest flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-ink">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/" className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms] text-center">
            Tilbake til forsiden
          </Link>
          <Link href="/utforsk" className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-ink hover:bg-cream transition-colors duration-[120ms] text-center">
            Utforsk annonser mens du venter
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest";
  const selectCls = "w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-amber uppercase tracking-wider">Kom i gang gratis</span>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">Registrer din klubb</h1>
        <p className="mt-3 text-ink-mid max-w-lg mx-auto">
          Gi klubbens medlemmer en egen markedsplass for brukt utstyr. Gratis å sette opp, ingen bindingstid.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-10">
        {[{ n: 1, label: "Klubbinfo" }, { n: 2, label: "Kontaktperson" }, { n: 3, label: "Tilpass" }].map(({ n, label }) => (
          <button key={n} onClick={() => setStep(n)} className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-[120ms] ${step >= n ? "bg-forest text-white" : "bg-border text-ink-light"}`}>
              {n}
            </span>
            <span className={`text-sm font-medium hidden sm:block ${step >= n ? "text-ink" : "text-ink-light"}`}>{label}</span>
            {n < 3 && <div className="w-12 h-px bg-border mx-2 hidden sm:block" />}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Om klubben</h2>
            <div>
              <label htmlFor="club-name" className="block text-sm font-medium text-ink mb-1.5">Klubbnavn *</label>
              <input id="club-name" type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="F.eks. Bergen Skiklubb" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-ink mb-1.5">Idrett / Aktivitet *</label>
                <select id="sport" value={sport} onChange={(e) => setSport(e.target.value)} className={selectCls}>
                  <option value="">Velg aktivitet</option>
                  <option>Ski / Alpint</option>
                  <option>Klatring</option>
                  <option>Sykkel</option>
                  <option>Løping</option>
                  <option>Friluftsliv</option>
                  <option>Fotball</option>
                  <option>Håndball</option>
                  <option>Annet</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-ink mb-1.5">Sted *</label>
                <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="F.eks. Bergen" className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="members" className="block text-sm font-medium text-ink mb-1.5">Ca. antall medlemmer</label>
              <select id="members" value={memberCount} onChange={(e) => setMemberCount(e.target.value)} className={selectCls}>
                <option value="">Velg</option>
                <option>Under 100</option>
                <option>100–300</option>
                <option>300–500</option>
                <option>500–1000</option>
                <option>Over 1000</option>
              </select>
            </div>
            <div>
              <label htmlFor="org-number" className="block text-sm font-medium text-ink mb-1.5">Organisasjonsnummer (valgfritt)</label>
              <input id="org-number" type="text" value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} placeholder="9 siffer fra Brønnøysundregistrene" className={inputCls} />
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-semibold text-ink mb-6">Kontaktperson</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="first-name" className="block text-sm font-medium text-ink mb-1.5">Fornavn *</label>
                <input id="first-name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="last-name" className="block text-sm font-medium text-ink mb-1.5">Etternavn *</label>
                <input id="last-name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-ink mb-1.5">E-post *</label>
              <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@epost.no" className={inputCls} />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-ink mb-1.5">Telefon</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+47" className={inputCls} />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-ink mb-1.5">Din rolle i klubben</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
                <option value="">Velg rolle</option>
                <option>Lagleder / Styreleder</option>
                <option>Trener</option>
                <option>Styremedlem</option>
                <option>Frivillig</option>
                <option>Medlem</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-semibold text-ink">Tilpass klubbsiden</h2>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-ink mb-3">Klubblogo</label>
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-border"
                  style={{ backgroundColor: logoPreview ? "transparent" : primaryColor }}
                >
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
                    <button type="button" onClick={() => { setLogoPreview(""); setLogoUrl(""); }} className="block text-xs text-ink-light hover:text-red-500 transition-colors duration-[120ms]">
                      Fjern logo
                    </button>
                  )}
                  {logoUrl && !logoUploading && <p className="text-xs text-forest">Logo lastet opp ✓</p>}
                </div>
              </div>
              <p className="text-xs text-ink-light mt-2">PNG, JPG eller SVG anbefales.</p>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Primærfarge *</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#1a3c2e" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
                </div>
                <p className="text-xs text-ink-light mt-1.5">Bannerfarge og hovedflater</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Sekundærfarge <span className="font-normal text-ink-light">(valgfritt)</span></label>
                <div className="flex items-center gap-3">
                  <input type="color" value={secondaryColor || primaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
                  <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} placeholder="Tomt = samme som primær" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest" />
                  {secondaryColor && (
                    <button type="button" onClick={() => setSecondaryColor("")} className="text-xs text-ink-light hover:text-red-500 transition-colors flex-shrink-0">
                      Nullstill
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink-light mt-1.5">Knapper og accenter</p>
              </div>
            </div>

            {/* Live preview */}
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
                  <button type="button" className="ml-auto rounded-lg px-4 py-1.5 text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: secondaryColor || "#e8843a" }}>
                    Bli med
                  </button>
                </div>
                <div className="bg-white px-5 py-2.5">
                  <p className="text-xs text-ink-light">Slik ser klubbsiden ut for besøkende</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">Kort beskrivelse av klubben</label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fortell litt om klubben, aktiviteter, og hvorfor dere vil bruke Sportsbyttet..."
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="text-sm font-medium text-ink-light hover:text-ink transition-colors duration-[120ms]">
              ← Tilbake
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="rounded-lg bg-forest px-7 py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors duration-[120ms]">
              Neste steg →
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {submitError && <p className="text-xs text-red-600">{submitError}</p>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-amber px-7 py-2.5 text-sm font-bold text-white hover:brightness-92 transition-colors duration-[120ms] disabled:opacity-50"
              >
                {submitting ? "Sender..." : "Registrer klubben"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: "Gratis oppstart", desc: "Ingen kostnad for å sette opp klubbsiden. Betal kun for premium-funksjoner." },
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
