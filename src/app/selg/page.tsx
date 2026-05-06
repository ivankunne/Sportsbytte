"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Category, Club } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { AuthForm } from "@/components/AuthForm";
type KartverketResult = {
  name: string;
  kommune: string;
  type: string;
  lat: number;
  lng: number;
};

type AuthPhase = "checking" | "auth" | "form";
type ListingType = "regular" | "iso" | "bulk" | "gi_bort";

type FormState = {
  title: string;
  condition: string;
  wearDescription: string;
  price: string;
  description: string;
  quantity: string;
  sizeRange: string;
  membersOnly: boolean;
  location: string;
  sportAttributes: Record<string, string>;
};

type DraftData = {
  form: FormState;
  selectedCategory: string;
  listingType: ListingType;
  deliveryMethod: string;
  fastMode: boolean;
  savedAt: string;
};

const DRAFT_KEY = "selg_draft_v1";
const TEMPLATE_KEY = "selg_template_v1";

type TemplateData = {
  category: string;
  condition: string;
  deliveryMethod: string;
  membersOnly: boolean;
  sizeRange?: string;
};

const INITIAL_FORM: FormState = {
  title: "",
  condition: "",
  wearDescription: "",
  price: "",
  description: "",
  quantity: "2",
  sizeRange: "",
  membersOnly: false,
  location: "",
  sportAttributes: {},
};

// Sport-specific attribute definitions per category
const SPORT_ATTRIBUTES: Record<string, { key: string; label: string; placeholder: string }[]> = {
  "Alpint":        [{ key: "ski_length", label: "Skilengde (cm)", placeholder: "F.eks. 170" }, { key: "boot_size", label: "Støvelstørrelse", placeholder: "F.eks. 26.5" }, { key: "binding", label: "Binding", placeholder: "F.eks. Marker Griffon" }],
  "Langrenn":      [{ key: "ski_length", label: "Skilengde (cm)", placeholder: "F.eks. 195" }, { key: "boot_size", label: "Støvelstørrelse", placeholder: "F.eks. 43" }],
  "Ski (andre)":   [{ key: "ski_length", label: "Skilengde (cm)", placeholder: "F.eks. 160" }],
  "Sykling":       [{ key: "frame_size", label: "Rammestørrelse", placeholder: "F.eks. M / 54 cm" }, { key: "wheel_size", label: "Hjulstørrelse", placeholder: "F.eks. 29 tommer" }, { key: "bike_type", label: "Sykkeltype", placeholder: "F.eks. MTB, Landevei, Gravel" }],
  "Fotball":       [{ key: "shoe_size", label: "Skostørrelse", placeholder: "F.eks. 42" }],
  "Ishockey":      [{ key: "skate_size", label: "Skøytestørrelse", placeholder: "F.eks. 9" }, { key: "stick_flex", label: "Stav flex", placeholder: "F.eks. 75" }],
  "Løping":        [{ key: "shoe_size", label: "Skostørrelse", placeholder: "F.eks. 43" }],
  "Tennis / Padel":[{ key: "grip_size", label: "Gripstørrelse", placeholder: "F.eks. L2 / 4 1/4" }, { key: "string_pattern", label: "Strenging", placeholder: "F.eks. 16x19" }],
  "Golf":          [{ key: "shaft_flex", label: "Skaftflex", placeholder: "F.eks. Regular / Stiff" }, { key: "club_type", label: "Kølle-type", placeholder: "F.eks. Jern, Driver, Wedge" }],
  "Svømming":      [{ key: "suit_size", label: "Drakt størrelse", placeholder: "F.eks. M / 36" }],
  "Kampsport":     [{ key: "glove_size", label: "Hansker størrelse", placeholder: "F.eks. 12 oz" }],
};

function detectCategory(title: string, categories: Category[]): string {
  if (!title.trim()) return "";
  const t = title.toLowerCase();
  for (const cat of categories) {
    if (t.includes(cat.name.toLowerCase())) return cat.name;
  }
  const words = t.split(/[\s\-_,]+/).filter((w) => w.length >= 3);
  for (const cat of categories) {
    const catWords = cat.name.toLowerCase().split(/[\s\-_&()/]+/).filter((w) => w.length >= 3);
    if (words.some((w) => catWords.some((cw) => cw.startsWith(w) || w.startsWith(cw)))) {
      return cat.name;
    }
  }
  return "";
}

const LISTING_TYPE_ICONS: Record<ListingType, React.ReactNode> = {
  regular: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  iso: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 7.5v6M7.5 10.5h6" />
    </svg>
  ),
  bulk: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  ),
  gi_bort: (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1019.5 7.125c0 1.023-.49 1.93-1.259 2.525A2.625 2.625 0 1012 4.875zm0 0A2.625 2.625 0 104.5 7.125c0 1.023.49 1.93 1.259 2.525M12 4.875V7.5m0 0H8.25M12 7.5h3.75M12 7.5v9.375" />
    </svg>
  ),
};

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
        </div>
      }
    >
      <SellPageContent />
    </Suspense>
  );
}

function SellPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authPhase, setAuthPhase] = useState<AuthPhase>("checking");
  const [fastMode, setFastMode] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null);

  const [listingType, setListingType] = useState<ListingType>("regular");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [deliveryMethod, setDeliveryMethod] = useState("both");
  const [categories, setCategories] = useState<Category[]>([]);
  const [userClub, setUserClub] = useState<Pick<Club, "id" | "name" | "color" | "initials"> | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [userProfileId, setUserProfileId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [savedTemplate, setSavedTemplate] = useState<TemplateData | null>(null);

  const [locationSuggestions, setLocationSuggestions] = useState<KartverketResult[]>([]);
  const [showLocationSugs, setShowLocationSugs] = useState(false);
  const [locationFetching, setLocationFetching] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const urlPrefillApplied = useRef(false);

  function handleLocationChange(val: string) {
    setForm((prev) => ({ ...prev, location: val }));
    setSelectedLat(null);
    setSelectedLng(null);
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    if (val.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSugs(false);
      return;
    }
    setLocationFetching(true);
    locationDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(val)}*&fuzzy=true&treffPerSide=8&utkoordsys=4258`
        );
        const json = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: KartverketResult[] = (json.navn ?? []).map((item: any) => ({
          name: item.stedsnavn?.[0]?.skrivemåte ?? "",
          kommune: item.kommuner?.[0]?.kommunenavn ?? "",
          type: item.navneobjekttype ?? "",
          lat: item.representasjonspunkt?.nord ?? 0,
          lng: item.representasjonspunkt?.øst ?? 0,
        })).filter((r: KartverketResult) => r.name && r.lat && r.lng);
        setLocationSuggestions(results);
        setShowLocationSugs(results.length > 0);
      } catch {
        setLocationSuggestions([]);
        setShowLocationSugs(false);
      } finally {
        setLocationFetching(false);
      }
    }, 250);
  }

  function selectLocationSuggestion(result: KartverketResult) {
    setForm((prev) => ({ ...prev, location: result.name }));
    setSelectedLat(result.lat);
    setSelectedLng(result.lng);
    setShowLocationSugs(false);
  }

  const locationInputJSX = (id: string) => (
    <div className="relative">
      <div className="flex items-center rounded-lg border border-border bg-white focus-within:ring-2 focus-within:ring-forest/20 focus-within:border-forest">
        <svg className="ml-3 h-4 w-4 text-ink-light flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <input
          id={id}
          type="text"
          value={form.location}
          onChange={(e) => handleLocationChange(e.target.value)}
          onFocus={() => locationSuggestions.length > 0 && setShowLocationSugs(true)}
          onBlur={() => setTimeout(() => setShowLocationSugs(false), 150)}
          placeholder="F.eks. Oslo, Frogner, Lillehammer..."
          autoComplete="off"
          className="flex-1 px-3 py-2.5 text-sm text-ink bg-transparent focus:outline-none"
        />
        {locationFetching && (
          <div className="mr-2 h-3.5 w-3.5 rounded-full border-2 border-forest border-t-transparent animate-spin flex-shrink-0" />
        )}
        {form.location && !locationFetching && (
          <button
            type="button"
            onClick={() => { setForm((prev) => ({ ...prev, location: "" })); setSelectedLat(null); setSelectedLng(null); setShowLocationSugs(false); }}
            className="mr-2 text-ink-light hover:text-ink flex-shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {showLocationSugs && locationSuggestions.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-border shadow-lg overflow-hidden">
          {locationSuggestions.map((result) => (
            <button
              key={`${result.name}-${result.lat}-${result.lng}`}
              type="button"
              onMouseDown={() => selectLocationSuggestion(result)}
              className="w-full text-left px-4 py-2.5 hover:bg-cream transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-3.5 w-3.5 text-ink-light flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.5a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-ink font-medium truncate">{result.name}</span>
              </div>
              <span className="text-xs text-ink-light flex-shrink-0">
                {result.kommune}{result.type && result.type !== result.kommune ? ` · ${result.type}` : ""}
              </span>
            </button>
          ))}
          <div className="px-4 py-1.5 border-t border-border bg-cream/50">
            <p className="text-[10px] text-ink-light">Stedsnavn fra Kartverket</p>
          </div>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAuthPhase("auth"); return; }
      await prefillFromSession(session.user.id);
    }
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function prefillFromSession(authUserId: string) {
    const { data: { session } } = await supabase.auth.getSession();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, club_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (profile) {
      setUserProfileId(profile.id);
      if (profile.club_id) {
        setSelectedClubId(profile.club_id);
        const { data: club } = await supabase
          .from("clubs")
          .select("id, name, color, initials")
          .eq("id", profile.club_id)
          .maybeSingle();
        if (club) setUserClub(club);
      }

      // Load DB draft first, fall back to localStorage
      if (session) {
        try {
          const res = await fetch("/api/listing-draft", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const { draft } = await res.json();
          if (draft?.form_data?.form?.title) {
            const age = Date.now() - new Date(draft.updated_at).getTime();
            if (age < 7 * 24 * 60 * 60 * 1000) {
              setPendingDraft({ ...draft.form_data, savedAt: draft.updated_at });
              setShowDraftBanner(true);
            }
          }
        } catch {
          // Fall back to localStorage
          try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
              const draft = JSON.parse(raw) as DraftData;
              const age = Date.now() - new Date(draft.savedAt).getTime();
              if (age < 24 * 60 * 60 * 1000 && draft.form.title) {
                setPendingDraft(draft);
                setShowDraftBanner(true);
              }
            }
          } catch {}
        }
      }
    }

    try {
      const tpl = localStorage.getItem(TEMPLATE_KEY);
      if (tpl) setSavedTemplate(JSON.parse(tpl) as TemplateData);
    } catch {}

    setAuthPhase("form");
  }

  useEffect(() => {
    if (authPhase !== "form") return;
    supabase.from("categories").select("*").order("id").then(({ data: cats }) => {
      if (cats) setCategories(cats);
    });
  }, [authPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // URL prefill from "Post lignende" in dashboard
  useEffect(() => {
    if (authPhase !== "form" || categories.length === 0 || urlPrefillApplied.current) return;
    const titleParam = searchParams.get("title");
    const categoryParam = searchParams.get("category");
    const conditionParam = searchParams.get("condition");
    const priceParam = searchParams.get("price");
    if (titleParam || categoryParam || conditionParam || priceParam) {
      urlPrefillApplied.current = true;
      setForm((f) => ({
        ...f,
        title: titleParam ?? f.title,
        condition: conditionParam ?? f.condition,
        price: priceParam ?? f.price,
      }));
      if (categoryParam) setSelectedCategory(categoryParam);
      setFastMode(false);
    }
  }, [authPhase, categories, searchParams]);

  // Auto-detect category from title in fast mode
  useEffect(() => {
    if (!fastMode || selectedCategory || !categories.length) return;
    const detected = detectCategory(form.title, categories);
    if (detected) setSelectedCategory(detected);
  }, [form.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Draft auto-save (debounced 800ms) — local + DB
  useEffect(() => {
    if (authPhase !== "form") return;
    const timer = setTimeout(async () => {
      if (!form.title && !selectedCategory) return;
      const draft: DraftData = {
        form, selectedCategory, listingType, deliveryMethod, fastMode,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      // Also persist to DB (best-effort)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetch("/api/listing-draft", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(draft),
        }).catch(() => {});
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [form, selectedCategory, listingType, deliveryMethod, fastMode, authPhase]);

  function restoreDraft() {
    if (!pendingDraft) return;
    setForm(pendingDraft.form);
    setSelectedCategory(pendingDraft.selectedCategory);
    setListingType(pendingDraft.listingType);
    setDeliveryMethod(pendingDraft.deliveryMethod);
    setFastMode(pendingDraft.fastMode);
    setShowDraftBanner(false);
    setPendingDraft(null);
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
    setPendingDraft(null);
  }

  function saveTemplate() {
    const tpl: TemplateData = {
      category: selectedCategory,
      condition: form.condition,
      deliveryMethod,
      membersOnly: form.membersOnly,
      sizeRange: form.sizeRange || undefined,
    };
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(tpl));
    setSavedTemplate(tpl);
  }

  function applyTemplate() {
    if (!savedTemplate) return;
    if (savedTemplate.category) setSelectedCategory(savedTemplate.category);
    setForm((f) => ({
      ...f,
      condition: savedTemplate.condition || f.condition,
      membersOnly: savedTemplate.membersOnly,
      sizeRange: savedTemplate.sizeRange ?? f.sizeRange,
    }));
    setDeliveryMethod(savedTemplate.deliveryMethod);
  }

  function scrollTo(ref: React.RefObject<HTMLElement | null>) {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"];
    const tooBig = incoming.find((f) => f.size > MAX_SIZE);
    const wrongType = incoming.find((f) => !ALLOWED.includes(f.type.toLowerCase()));
    if (tooBig) { setError(`"${tooBig.name}" er for stor (maks 10 MB per bilde).`); e.target.value = ""; return; }
    if (wrongType) { setError(`"${wrongType.name}" har ugyldig format. Bruk JPG, PNG eller WebP.`); e.target.value = ""; return; }
    setError("");
    const combined = [...imageFiles, ...incoming].slice(0, 8);
    setImageFiles(combined);
    setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  }

  function removeImage(index: number) {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  function handleDragStart(e: React.DragEvent, i: number) {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragEnter(i: number) { setDragOverIndex(i); }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  function handleDrop(i: number) {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    const newFiles = [...imageFiles];
    const [dragged] = newFiles.splice(dragIndex, 1);
    newFiles.splice(i, 0, dragged);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
    setDragIndex(null);
    setDragOverIndex(null);
  }
  function handleDragEnd() { setDragIndex(null); setDragOverIndex(null); }

  async function uploadImages(): Promise<string[]> {
    if (imageFiles.length === 0) return [];
    const urls: string[] = [];
    for (const file of imageFiles) {
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
      const { data, error: uploadErr } = await supabase.storage
        .from("listing-images")
        .upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(data.path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  }

  async function handleSubmit() {
    setError("");

    const effectiveCondition = (fastMode && !form.condition) ? "Pent brukt" : form.condition;
    const effectiveListingType = fastMode ? "regular" : listingType;
    const isISO = effectiveListingType === "iso";
    const isBulk = effectiveListingType === "bulk";
    const isGiBort = effectiveListingType === "gi_bort";

    if (!selectedCategory) return setError("Velg en kategori");
    if (!form.title.trim()) return setError("Skriv inn en tittel");
    if (!fastMode && !isISO && !isGiBort && !effectiveCondition) return setError("Velg stand på utstyret");
    if (!isISO && !isGiBort && !form.price) return setError("Skriv inn pris");

    if (!userProfileId) return setError("Profil ikke funnet. Prøv å logge inn på nytt.");

    setSubmitting(true);
    try {
      setUploading(true);
      const imageUrls = await uploadImages();
      setUploading(false);

      const specs: Record<string, string> = {};
      if (effectiveCondition) specs["Stand"] = effectiveCondition;
      if (form.wearDescription) specs["Slitasje"] = form.wearDescription;
      if (isBulk && form.quantity) specs["Antall"] = form.quantity;
      if (isBulk && form.sizeRange) specs["Størrelser"] = form.sizeRange;
      // Merge sport-specific attributes
      Object.assign(specs, form.sportAttributes);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Ikke innlogget");

      // lat/lng set when user picks a Kartverket suggestion

      const res = await fetch("/api/create-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: selectedCategory,
          condition: isISO ? "Søker" : isGiBort ? "Gi bort" : effectiveCondition,
          price: isISO || isGiBort ? 0 : parseInt(form.price || "0"),
          images: imageUrls,
          specs,
          club_id: selectedClubId,
          listing_type: effectiveListingType,
          members_only: form.membersOnly,
          quantity: isBulk ? parseInt(form.quantity || "2") : null,
          size_range: isISO ? null : form.sizeRange || null,
          delivery_method: isISO ? null : deliveryMethod,
          is_sold: false,
          location: form.location || null,
          lat: selectedLat,
          lng: selectedLng,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Noe gikk galt");
      localStorage.removeItem(DRAFT_KEY);
      router.push(`/annonse/${result.id}?published=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen.");
      setSubmitting(false);
      setUploading(false);
    }
  }

  const isISO = !fastMode && listingType === "iso";
  const isBulk = !fastMode && listingType === "bulk";
  const isGiBort = !fastMode && listingType === "gi_bort";
  const noPhotoStep = isISO || isGiBort;
  const step4Num = noPhotoStep ? "3" : "4";
  const step5Num = noPhotoStep ? "4" : "5";

  if (authPhase === "checking") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  if (authPhase === "auth") {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-ink">Logg inn for å selge</h1>
          <p className="mt-2 text-sm text-ink-light">Du må være innlogget for å legge ut annonser.</p>
        </div>
        <AuthForm onSuccess={({ authUserId }) => prefillFromSession(authUserId)} />
      </div>
    );
  }

  // ── Photo grid (shared between fast + detailed mode) ──────────────
  const photoGrid = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageSelect}
      />
      {imagePreviews.length === 0 ? (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed border-border bg-white p-8 text-center transition-colors duration-[120ms] ${
            uploading ? "opacity-50 cursor-not-allowed" : "hover:border-forest/30 cursor-pointer"
          }`}
        >
          <svg className="mx-auto h-12 w-12 text-ink-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-ink">
            {fastMode ? "Legg til bilder (valgfritt)" : "Dra bilder hit eller klikk for å laste opp"}
          </p>
          <p className="mt-1 text-xs text-ink-light">Opptil 8 bilder • Første bilde blir hovedbilde</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {imagePreviews.map((src, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square rounded-lg overflow-hidden border border-border cursor-grab active:cursor-grabbing transition-all duration-[120ms] ${
                dragIndex === i ? "opacity-40 scale-95" : ""
              } ${dragOverIndex === i && dragIndex !== i ? "ring-2 ring-forest ring-offset-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-ink/70 text-white flex items-center justify-center text-xs hover:bg-ink transition-colors"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-forest text-white rounded px-1 py-0.5">
                  Hoved
                </span>
              )}
            </div>
          ))}
          {imagePreviews.length < 8 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border-2 border-dashed border-border bg-white flex items-center justify-center hover:border-forest/30 transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-6 w-6 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          )}
        </div>
      )}
      {imagePreviews.length > 1 && (
        <p className="mt-2 text-xs text-ink-light text-center">Dra for å endre rekkefølge — første bilde blir forsidebilde</p>
      )}
    </>
  );

  // ── Club display (shared) ─────────────────────────────────────────
  const clubSection = userClub ? (
    <div className="bg-white rounded-xl p-6">
      <label className="block text-sm font-medium text-ink mb-3">Publiser til klubb</label>
      {selectedClubId ? (
        <>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-forest-light border-2 border-forest">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: userClub.color }}
            >
              {userClub.initials}
            </div>
            <span className="font-medium text-ink text-sm flex-1">{userClub.name}</span>
            <svg className="h-4 w-4 text-forest flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => setSelectedClubId(null)}
            className="mt-3 text-xs text-ink-light hover:text-ink underline"
          >
            Publiser kun på min profil (uten klubb)
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-light mb-3">Annonsen publiseres kun på din profil.</p>
          <button
            type="button"
            onClick={() => setSelectedClubId(userClub.id)}
            className="flex items-center gap-3 p-3 rounded-lg bg-cream border-2 border-dashed border-border hover:border-forest/40 transition-colors duration-[120ms] w-full text-left"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 opacity-60"
              style={{ backgroundColor: userClub.color }}
            >
              {userClub.initials}
            </div>
            <span className="text-sm text-ink-light">Legg til {userClub.name}</span>
          </button>
        </>
      )}
    </div>
  ) : (
    <div className="bg-white rounded-xl p-6">
      <label className="block text-sm font-medium text-ink mb-3">Publiser til</label>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-forest-light border-2 border-forest">
        <div className="h-8 w-8 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0">
          <svg className="h-4 w-4 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <span className="font-medium text-ink text-sm flex-1">Min profil</span>
        <svg className="h-4 w-4 text-forest flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="mt-3 text-xs text-ink-light">
        Du er ikke med i noen klubb ennå — annonsen vises på din profil.{" "}
        <Link href="/klubber" className="text-forest hover:underline">Bli med i en klubb</Link>
        {" "}eller{" "}
        <Link href="/registrer-klubb" className="text-forest hover:underline">registrer din klubb</Link>{" "}
        for å nå enda flere.
      </p>
    </div>
  );

  // ── Submit button ─────────────────────────────────────────────────
  const submitButton = (
    <div className="pt-2 pb-8">
      {(selectedCategory || form.condition || deliveryMethod !== "both") && (
        <div className="mb-4 text-center">
          <button
            type="button"
            onClick={saveTemplate}
            className="text-xs text-ink-light hover:text-ink transition-colors underline underline-offset-2"
          >
            {savedTemplate ? "Oppdater mal med gjeldende innstillinger" : "Lagre kategori og innstillinger som mal"}
          </button>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || uploading}
        className="w-full rounded-lg bg-amber py-4 text-base font-bold text-white hover:brightness-92 transition-all duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading
          ? "Laster opp bilder..."
          : submitting
          ? "Publiserer..."
          : fastMode
          ? "Publiser annonse ⚡"
          : isISO
          ? "Publiser ettersøk"
          : isBulk
          ? "Publiser massesalg"
          : isGiBort
          ? "🎁 Publiser gratis annonse"
          : "Publiser annonse"}
      </button>
      <p className="mt-4 text-center text-xs text-ink-light">
        Trygg kortbetaling • Selger og kjøper avtaler levering • Klubbbeskyttelse
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink">
          {isISO ? "Ettersøk utstyr" : "Selg utstyr"}
        </h1>
        <p className="mt-2 text-ink-mid">
          {isISO
            ? "Fortell hva du ser etter — la andre klubbmedlemmer finne det for deg."
            : fastMode
            ? "Legg ut på under ett minutt."
            : "Nå hundrevis av sportsentusiaster i din klubb og på plattformen."}
        </p>

        {/* Mode toggle */}
        <div className="inline-flex items-center mt-5 rounded-full bg-cream p-1 gap-1">
          <button
            onClick={() => setFastMode(true)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-[120ms] ${
              fastMode ? "bg-forest text-white shadow-sm" : "text-ink-light hover:text-ink"
            }`}
          >
            ⚡ Hurtigpost
          </button>
          <button
            onClick={() => setFastMode(false)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-[120ms] ${
              !fastMode ? "bg-forest text-white shadow-sm" : "text-ink-light hover:text-ink"
            }`}
          >
            Detaljert
          </button>
        </div>

        {/* Saved template chip */}
        {savedTemplate?.category && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={applyTemplate}
              className="inline-flex items-center gap-1.5 rounded-full bg-forest-light border border-forest/20 px-3 py-1 text-xs font-medium text-forest hover:bg-forest/10 transition-colors"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
              Mal: {savedTemplate.category}{savedTemplate.condition ? ` · ${savedTemplate.condition}` : ""}
            </button>
          </div>
        )}
      </div>

      {/* Draft restore banner */}
      {showDraftBanner && pendingDraft && (
        <div className="mb-6 rounded-xl border border-amber/30 bg-amber-light px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-dark">Du har et ulagret utkast</p>
            <p className="text-xs text-amber-dark/70 mt-0.5">
              Lagret{" "}
              {new Date(pendingDraft.savedAt).toLocaleString("nb-NO", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
              {pendingDraft.form.title ? ` · "${pendingDraft.form.title}"` : ""}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={restoreDraft}
              className="rounded-lg bg-amber-dark/10 border border-amber/40 px-3 py-1.5 text-xs font-semibold text-amber-dark hover:bg-amber-dark/20 transition-colors"
            >
              Gjenopprett
            </button>
            <button
              onClick={discardDraft}
              className="rounded-lg px-3 py-1.5 text-xs text-amber-dark/70 hover:text-amber-dark transition-colors"
            >
              Forkast
            </button>
          </div>
        </div>
      )}

      {fastMode ? (
        // ── FAST MODE ─────────────────────────────────────────────────
        <div className="space-y-5">
          {/* Photos */}
          {photoGrid}

          {/* Title + Price */}
          <div className="bg-white rounded-xl p-6 space-y-4">
            <div>
              <label htmlFor="fast-title" className="block text-sm font-medium text-ink mb-1.5">
                Hva selger du?
              </label>
              <input
                id="fast-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder='F.eks. "Salomon QST 106 ski — 180 cm"'
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="fast-price" className="block text-sm font-medium text-ink mb-1.5">
                Pris (NOK)
              </label>
              <div className="relative">
                <input
                  id="fast-price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-border px-4 py-3 text-2xl font-bold text-forest placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-ink-light">kr</span>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl p-6">
            <label className="block text-sm font-medium text-ink mb-3">Kategori</label>
            {selectedCategory ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-forest-light border-2 border-forest px-3 py-2 flex-shrink-0">
                  <span className="text-sm font-medium text-forest">{selectedCategory}</span>
                  <svg className="h-4 w-4 text-forest" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  className="text-xs text-ink-light hover:text-ink underline"
                >
                  Bytt
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-ink-light mb-3">
                  Skriv en tittel for automatisk deteksjon, eller velg manuelt:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(cat.name)}
                      className="flex items-center gap-2 rounded-lg p-2.5 text-left hover:bg-cream transition-colors border border-border"
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-xs font-medium text-ink">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Size */}
          <div className="bg-white rounded-xl p-6">
            <label htmlFor="fast-size" className="block text-sm font-medium text-ink mb-1.5">
              Størrelse <span className="text-ink-light font-normal">(valgfritt)</span>
            </label>
            <input
              id="fast-size"
              type="text"
              value={form.sizeRange}
              onChange={(e) => setForm({ ...form, sizeRange: e.target.value })}
              placeholder="F.eks. M, 42, 180 cm"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
            />
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl p-6">
            <label htmlFor="fast-location" className="block text-sm font-medium text-ink mb-1.5">
              Sted <span className="text-ink-light font-normal">(valgfritt)</span>
            </label>
            {locationInputJSX("fast-location")}
          </div>

          {/* Club */}
          {clubSection}

          {submitButton}
        </div>
      ) : (
        // ── DETAILED MODE ─────────────────────────────────────────────
        <div className="space-y-10">

          {/* Step 1: Listing type */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">1</span>
              <h2 className="font-display text-xl font-semibold text-ink">Type annonse</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([
                { id: "regular" as const, label: "Selg utstyr", desc: "Selg ett enkelt utstyr" },
                { id: "iso" as const, label: "Ettersøk (ISO)", desc: "Søker etter bestemt utstyr" },
                { id: "bulk" as const, label: "Massesalg", desc: "Selg lag-utstyr i bulk" },
                { id: "gi_bort" as const, label: "Gi bort gratis", desc: "Gi bort utstyr du ikke trenger" },
              ]).map((type) => (
                <button
                  key={type.id}
                  onClick={() => { setListingType(type.id); scrollTo(categoryRef); }}
                  className={`flex flex-col gap-2 rounded-xl p-4 text-left transition-all duration-[120ms] ${
                    listingType === type.id
                      ? "bg-forest text-white ring-2 ring-forest ring-offset-2"
                      : "bg-white text-ink hover:bg-border/60"
                  }`}
                >
                  <span className={listingType === type.id ? "text-white" : "text-ink-light"}>
                    {LISTING_TYPE_ICONS[type.id]}
                  </span>
                  <span className="text-sm font-semibold">{type.label}</span>
                  <span className={`text-xs leading-snug ${listingType === type.id ? "text-white/70" : "text-ink-light"}`}>
                    {type.desc}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Category */}
          <section ref={categoryRef}>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">2</span>
              <h2 className="font-display text-xl font-semibold text-ink">Velg kategori</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => { setSelectedCategory(cat.name); scrollTo(detailsRef); }}
                  className={`flex items-center gap-3 rounded-xl p-4 text-left transition-all duration-[120ms] ${
                    selectedCategory === cat.name
                      ? "bg-forest text-white ring-2 ring-forest ring-offset-2"
                      : "bg-white text-ink hover:bg-border/60"
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: Photos */}
          {!noPhotoStep && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">3</span>
                <h2 className="font-display text-xl font-semibold text-ink">Legg til bilder</h2>
              </div>
              {photoGrid}
            </section>
          )}

          {/* Step 4: Details */}
          <section ref={detailsRef}>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
                {step4Num}
              </span>
              <h2 className="font-display text-xl font-semibold text-ink">Detaljer</h2>
            </div>

            <div className="space-y-5 bg-white rounded-xl p-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-ink mb-1.5">
                  {isISO ? "Hva ser du etter?" : "Tittel"}
                </label>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={isISO
                    ? 'F.eks. "Slalom ski str 170–180 cm, dame"'
                    : 'F.eks. "Salomon QST 106 ski — 180 cm"'}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                />
              </div>

              {!isISO && !isGiBort && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-ink mb-1.5">Stand</label>
                    <select
                      id="condition"
                      value={form.condition}
                      onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    >
                      <option value="">Velg stand</option>
                      <option>Som ny</option>
                      <option>Pent brukt</option>
                      <option>Godt brukt</option>
                      <option>Brukt</option>
                    </select>
                  </div>
                  {isBulk && (
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-ink mb-1.5">Antall enheter</label>
                      <input
                        id="quantity"
                        type="number"
                        min="2"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                      />
                    </div>
                  )}
                </div>
              )}

              {isGiBort && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  🎁 Gi bort-annonser er gratis. Ingen betaling — avtalt direkte mellom giver og mottaker.
                </div>
              )}

              {!isISO && !isGiBort && (
                <div>
                  <label htmlFor="sizeRange" className="block text-sm font-medium text-ink mb-1.5">
                    {isBulk ? "Størrelser tilgjengelig" : "Størrelse (valgfritt)"}
                  </label>
                  <input
                    id="sizeRange"
                    type="text"
                    value={form.sizeRange}
                    onChange={(e) => setForm({ ...form, sizeRange: e.target.value })}
                    placeholder={isBulk ? "F.eks. XS, S, M, L, XL eller 160–180 cm" : "F.eks. M, 42, 180 cm"}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                  />
                </div>
              )}

              {!isISO && !isGiBort && (
                <div>
                  <label htmlFor="wear" className="block text-sm font-medium text-ink mb-1.5">Nøyaktig stand</label>
                  <textarea
                    id="wear"
                    rows={2}
                    value={form.wearDescription}
                    onChange={(e) => setForm({ ...form, wearDescription: e.target.value })}
                    placeholder="Beskriv slitasje, reparasjoner, brukshistorikk..."
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                  />
                </div>
              )}

              {!isGiBort && (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-ink mb-1.5">
                    {isISO ? "Budsjett / maks pris (valgfritt)" : isBulk ? "Pris per enhet (NOK)" : "Pris (NOK)"}
                  </label>
                  <div className="relative">
                    <input
                      id="price"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0"
                      className="w-full rounded-lg border border-border px-4 py-3 text-2xl font-bold text-forest placeholder:text-ink-light/40 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-ink-light">kr</span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-ink mb-1.5">
                  {isISO ? "Mer info om hva du søker" : "Beskrivelse"}
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={
                    isISO
                      ? "Gi mer detaljer — størrelse, merke, formål, fleksibilitet på pris..."
                      : "Beskriv utstyret, historikk, hva som er inkludert..."
                  }
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-ink mb-1.5">
                  Sted <span className="text-ink-light font-normal">(valgfritt)</span>
                </label>
                {locationInputJSX("location")}
              </div>

              {/* Sport-specific attributes */}
              {selectedCategory && SPORT_ATTRIBUTES[selectedCategory] && (
                <div>
                  <p className="block text-sm font-medium text-ink mb-3">Spesifikasjoner for {selectedCategory}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SPORT_ATTRIBUTES[selectedCategory].map((attr) => (
                      <div key={attr.key}>
                        <label className="block text-xs font-medium text-ink-mid mb-1">{attr.label}</label>
                        <input
                          type="text"
                          value={form.sportAttributes[attr.key] ?? ""}
                          onChange={(e) => setForm({
                            ...form,
                            sportAttributes: { ...form.sportAttributes, [attr.key]: e.target.value },
                          })}
                          placeholder={attr.placeholder}
                          className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Step 5: Club, profile & shipping */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white text-sm font-bold">
                {step5Num}
              </span>
              <h2 className="font-display text-xl font-semibold text-ink">Klubb & profil</h2>
            </div>

            <div className="space-y-5">
              {clubSection}

              {/* Members only toggle */}
              <div className="bg-white rounded-xl p-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={form.membersOnly}
                      onChange={(e) => setForm({ ...form, membersOnly: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-border rounded-full peer peer-checked:bg-forest transition-colors duration-[120ms]" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-[120ms] peer-checked:translate-x-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-ink">Kun for klubbmedlemmer</span>
                    <p className="text-xs text-ink-light mt-0.5">Annonsen vises bare for godkjente medlemmer av valgt klubb</p>
                  </div>
                </label>
              </div>

              {/* Delivery method */}
              {!isISO && (
                <div className="bg-white rounded-xl p-6">
                  <label className="block text-sm font-medium text-ink mb-3">Leveringsmåte</label>
                  <div className="space-y-3">
                    {[
                      { id: "pickup", label: "Hentes av kjøper", desc: "Avtal sted og tidspunkt direkte" },
                      { id: "shipping", label: "Kan sendes", desc: "Kjøper betaler frakt — avtal detaljer i meldinger" },
                      { id: "both", label: "Begge deler", desc: "Henting eller sending — avtal med kjøper" },
                    ].map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors duration-[120ms] ${
                          deliveryMethod === option.id
                            ? "bg-forest-light border-2 border-forest"
                            : "bg-cream border-2 border-transparent hover:border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={deliveryMethod === option.id}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="mt-0.5 accent-forest"
                        />
                        <div>
                          <span className="text-sm font-medium text-ink">{option.label}</span>
                          <p className="text-xs text-ink-light mt-0.5">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {submitButton}
        </div>
      )}
    </div>
  );
}
