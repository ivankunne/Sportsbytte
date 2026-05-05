"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Category, Club } from "@/lib/queries";

type ParsedRow = {
  title: string;
  category: string;
  condition: string;
  price: string;
  description: string;
  error?: string;
};

type UploadResult = { title: string; ok: boolean; id?: number; error?: string };

const CONDITION_OPTIONS = ["Som ny", "Pent brukt", "Godt brukt", "Brukt"];
const TEMPLATE_CSV =
  "tittel,kategori,stand,pris,beskrivelse\n" +
  '"Salomon ski 180cm",Ski,Pent brukt,800,"God stand, inkl bindings"\n' +
  '"Hjelm str M",Sykling,Godt brukt,300,\n' +
  '"Fotballdrakt str XL",Fotball,Som ny,150,"Aldri brukt"\n';

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  // Skip header row
  const dataLines = lines.slice(1);
  return dataLines.map((line) => {
    const fields = splitCSVLine(line);
    const [title = "", category = "", condition = "", price = "", description = ""] = fields;
    const row: ParsedRow = {
      title: title.trim(),
      category: category.trim(),
      condition: condition.trim(),
      price: price.trim(),
      description: description.trim(),
    };
    if (!row.title) row.error = "Mangler tittel";
    else if (!row.category) row.error = "Mangler kategori";
    else if (!row.price || isNaN(Number(row.price))) row.error = "Ugyldig pris";
    else if (row.condition && !CONDITION_OPTIONS.includes(row.condition)) {
      row.error = `Ugyldig stand — bruk: ${CONDITION_OPTIONS.join(", ")}`;
    }
    return row;
  }).filter((r) => r.title || r.error);
}

function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userClub, setUserClub] = useState<Pick<Club, "id" | "name"> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/selg"); return; }
      setAuthed(true);
      const { data: profile } = await supabase
        .from("profiles").select("club_id").eq("auth_user_id", session.user.id).maybeSingle();
      if (profile?.club_id) {
        const { data: club } = await supabase
          .from("clubs").select("id, name").eq("id", profile.club_id).maybeSingle();
        if (club) setUserClub(club);
      }
      const { data: cats } = await supabase.from("categories").select("*").order("id");
      if (cats) setCategories(cats);
      setAuthChecked(true);
    }
    init();
  }, [router]);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      handleParse(text);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  function handlePaste(text: string) {
    setCsvText(text);
    if (text.trim()) handleParse(text);
  }

  function handleParse(text: string) {
    const parsed = parseCSV(text);
    // Validate categories against fetched list
    const catNames = categories.map((c) => c.name.toLowerCase());
    const validated = parsed.map((row) => {
      if (row.error) return row;
      if (row.category && !catNames.includes(row.category.toLowerCase())) {
        return { ...row, error: `Ukjent kategori: "${row.category}"` };
      }
      // Case-correct the category
      const matched = categories.find((c) => c.name.toLowerCase() === row.category.toLowerCase());
      return { ...row, category: matched?.name ?? row.category };
    });
    setRows(validated);
    setParsed(true);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sportsbytte_mal.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleUploadAll() {
    const validRows = rows.filter((r) => !r.error);
    if (!validRows.length) return;
    setUploading(true);
    setProgress(0);
    setResults([]);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setUploading(false); return; }

    const out: UploadResult[] = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const res = await fetch("/api/create-listing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: row.title,
            description: row.description || null,
            category: row.category,
            condition: row.condition || "Pent brukt",
            price: parseInt(row.price),
            images: [],
            specs: row.condition ? { Stand: row.condition } : {},
            club_id: userClub?.id ?? null,
            listing_type: "regular",
            members_only: false,
            delivery_method: "both",
            is_sold: false,
          }),
        });
        const json = await res.json();
        if (res.ok) {
          out.push({ title: row.title, ok: true, id: json.id });
        } else {
          out.push({ title: row.title, ok: false, error: json.error ?? "Feil" });
        }
      } catch {
        out.push({ title: row.title, ok: false, error: "Nettverksfeil" });
      }
      setProgress(i + 1);
      setResults([...out]);
    }
    setUploading(false);
    setDone(true);
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
      </div>
    );
  }

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => r.error);
  const successCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/selg" className="inline-flex items-center gap-1.5 text-sm text-forest hover:underline mb-4">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tilbake til selg
        </Link>
        <h1 className="font-display text-3xl font-bold text-ink">Masseopplasting</h1>
        <p className="mt-2 text-ink-mid">
          Last opp flere annonser på én gang via CSV. Perfekt for klubber som skal selge sesongutstyr.
        </p>
        {userClub && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-forest-light px-3 py-1.5 text-xs font-medium text-forest">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Annonsene publiseres til {userClub.name}
          </div>
        )}
      </div>

      {done ? (
        // ── Results ────────────────────────────────────────────────
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Ferdig!</h2>
            <div className="flex gap-4 mb-5">
              <div className="flex-1 text-center rounded-xl bg-forest-light py-4">
                <p className="text-2xl font-bold text-forest">{successCount}</p>
                <p className="text-xs text-forest/70 mt-1">Publisert</p>
              </div>
              {failCount > 0 && (
                <div className="flex-1 text-center rounded-xl bg-red-50 py-4">
                  <p className="text-2xl font-bold text-red-600">{failCount}</p>
                  <p className="text-xs text-red-500 mt-1">Feilet</p>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${r.ok ? "bg-forest-light" : "bg-red-50"}`}>
                  <span className={r.ok ? "text-forest" : "text-red-500"}>
                    {r.ok ? "✓" : "✗"}
                  </span>
                  <span className="flex-1 truncate text-ink">{r.title}</span>
                  {r.ok && r.id && (
                    <Link href={`/annonse/${r.id}`} className="text-xs text-forest hover:underline flex-shrink-0">
                      Se →
                    </Link>
                  )}
                  {!r.ok && <span className="text-xs text-red-500 flex-shrink-0">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard?tab=annonser"
              className="flex-1 rounded-lg bg-forest py-3 text-sm font-semibold text-white text-center hover:bg-forest-mid transition-colors"
            >
              Se mine annonser
            </Link>
            <button
              onClick={() => { setDone(false); setRows([]); setCsvText(""); setParsed(false); setResults([]); }}
              className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-ink hover:bg-cream transition-colors"
            >
              Last opp flere
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: Get CSV */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-white text-xs font-bold">1</span>
                <h2 className="font-semibold text-ink">Last opp eller lim inn CSV</h2>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-xs text-forest hover:underline"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Last ned mal
              </button>
            </div>

            <div className="text-xs text-ink-light bg-cream rounded-lg px-4 py-3 mb-4 font-mono leading-relaxed">
              <span className="font-semibold text-ink">Format:</span>{" "}
              tittel, kategori, stand, pris, beskrivelse<br />
              <span className="text-ink-light/70">Stand: Som ny / Pent brukt / Godt brukt / Brukt</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border bg-cream py-4 text-sm font-medium text-ink-light hover:border-forest/40 hover:text-ink transition-colors"
              >
                Klikk for å velge .csv-fil
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-ink-light">eller lim inn CSV-tekst</span>
                </div>
              </div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => handlePaste(e.target.value)}
                placeholder={"tittel,kategori,stand,pris,beskrivelse\n\"Salomon ski 180cm\",Ski,Pent brukt,800,\"God stand\"\n\"Hjelm str M\",Sykling,Godt brukt,300,"}
                className="w-full rounded-lg border border-border px-4 py-3 text-xs font-mono text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest resize-none"
              />
              {csvText && !parsed && (
                <button
                  onClick={() => handleParse(csvText)}
                  className="w-full rounded-lg bg-forest py-2.5 text-sm font-semibold text-white hover:bg-forest-mid transition-colors"
                >
                  Analyser CSV
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Preview */}
          {parsed && rows.length > 0 && (
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-white text-xs font-bold">2</span>
                <h2 className="font-semibold text-ink">
                  Forhåndsvisning — {validRows.length} klare
                  {errorRows.length > 0 && (
                    <span className="ml-2 text-red-500 text-sm font-normal">({errorRows.length} med feil)</span>
                  )}
                </h2>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-cream text-ink-light">
                      <th className="text-left px-3 py-2 font-medium">Tittel</th>
                      <th className="text-left px-3 py-2 font-medium">Kategori</th>
                      <th className="text-left px-3 py-2 font-medium">Stand</th>
                      <th className="text-right px-3 py-2 font-medium">Pris</th>
                      <th className="px-3 py-2 font-medium w-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-t border-border ${row.error ? "bg-red-50" : ""}`}>
                        <td className="px-3 py-2 font-medium text-ink max-w-[180px] truncate">{row.title || "—"}</td>
                        <td className="px-3 py-2 text-ink-mid">{row.category || "—"}</td>
                        <td className="px-3 py-2 text-ink-mid">{row.condition || "Pent brukt"}</td>
                        <td className="px-3 py-2 text-right text-forest font-semibold">
                          {row.price ? `${Number(row.price).toLocaleString("nb-NO")} kr` : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.error ? (
                            <span title={row.error} className="text-red-500 cursor-help">✗</span>
                          ) : (
                            <span className="text-forest">✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errorRows.length > 0 && (
                <div className="mt-3 space-y-1">
                  {errorRows.map((r, i) => (
                    <p key={i} className="text-xs text-red-500">
                      Rad {rows.indexOf(r) + 2}: {r.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Upload */}
          {parsed && validRows.length > 0 && (
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-white text-xs font-bold">3</span>
                <h2 className="font-semibold text-ink">Publiser</h2>
              </div>

              {uploading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-ink-mid mb-1">
                    <span>Publiserer {progress} av {validRows.length}...</span>
                    <span>{Math.round((progress / validRows.length) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-cream overflow-hidden">
                    <div
                      className="h-full bg-forest rounded-full transition-all duration-300"
                      style={{ width: `${(progress / validRows.length) * 100}%` }}
                    />
                  </div>
                  {results.length > 0 && (
                    <p className="text-xs text-ink-light">
                      Sist publisert: {results[results.length - 1].title}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleUploadAll}
                  className="w-full rounded-lg bg-amber py-4 text-base font-bold text-white hover:brightness-92 transition-all duration-[120ms]"
                >
                  Publiser {validRows.length} annonse{validRows.length !== 1 ? "r" : ""} nå
                </button>
              )}
            </div>
          )}

          {parsed && rows.length === 0 && (
            <div className="text-center py-8 text-sm text-ink-light">
              Ingen rader funnet i CSV-en. Sjekk formatet og prøv igjen.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
