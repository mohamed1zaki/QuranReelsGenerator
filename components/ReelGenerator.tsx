"use client"

import { useState } from "react"
import {
  SURAHS, BG_VIDEOS, RECITERS, LANGS, EDITIONS,
  loadVerses, surahHasBasmalaAsAyah1,
  type Verse, type BgVideo, type Reciter,
} from "@/lib/data"
import PreviewPlayer from "./PreviewPlayer"
import ExportPanel from "./ExportPanel"

export default function ReelGenerator() {
  // ── Form state ──────────────────────────────────────────────
  const [surahIdx, setSurahIdx]   = useState(0)
  const [verseFrom, setVerseFrom] = useState(1)
  const [verseTo, setVerseTo]     = useState(3)
  const [bgId, setBgId]           = useState(BG_VIDEOS[0].id)
  const [recId, setRecId]         = useState(RECITERS[0].id)
  const [lang, setLang]           = useState("en")

  // ── Generator state ─────────────────────────────────────────
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [verses, setVerses]     = useState<Verse[] | null>(null)

  const surah   = SURAHS[surahIdx]
  const bgVideo = BG_VIDEOS.find(b => b.id === bgId)!
  const reciter = RECITERS.find(r => r.id === recId)!

  // Does this surah have a basmala as ayah 1?
  const hasBasmala = surahHasBasmalaAsAyah1(surah.n)

  function changeSurah(i: number) {
    setSurahIdx(i)
    const sNum  = SURAHS[i].n
    const hasBas = surahHasBasmalaAsAyah1(sNum)
    // Default: skip basmala (ayah 1) to start at real content (ayah 2)
    // so audio and text match perfectly without confusion.
    const defaultStart = hasBas ? 2 : 1
    setVerseFrom(defaultStart)
    setVerseTo(Math.min(defaultStart + 2, SURAHS[i].v))
    setVerses(null)
  }

  async function generate() {
    setError("")
    setLoading(true)
    setVerses(null)
    try {
      // Clamp range to surah bounds
      const from = Math.max(1, Math.min(verseFrom, surah.v))
      const to   = Math.min(verseTo, from + 9, surah.v)

      const data = await loadVerses(surah.n, from, to, EDITIONS[lang] ?? null)
      setVerses(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load verses")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* HEADER */}
      <header className="flex items-center gap-3 px-6 py-4 border-b"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-amiri text-lg shrink-0"
          style={{ background: "var(--gold-dim)", border: "1px solid var(--gold)", color: "var(--gold)" }}>
          ق
        </div>
        <h1 className="text-[17px] font-medium tracking-tight">
          Quran Reels{" "}
          <span className="text-[13px] font-light" style={{ color: "var(--muted)" }}>— Free Video Generator</span>
        </h1>
        <span className="ml-auto text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{ color: "var(--green)", background: "rgba(63,185,80,.1)", border: "1px solid rgba(63,185,80,.25)" }}>
          ✦ Free & Unlimited
        </span>
      </header>

      {/* HERO */}
      <div className="text-center px-6 pt-12 pb-8 max-w-lg mx-auto">
        <h2 className="text-[28px] font-semibold leading-snug mb-2">
          Create <em className="not-italic" style={{ color: "var(--gold)" }}>viral Quran reels</em>
        </h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Verse-by-verse · Synchronized audio · Real MP4 output · No account needed
        </p>
      </div>

      {/* LAYOUT */}
      <div className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">

        {/* ── LEFT: SETTINGS ── */}
        <div className="space-y-4">

          {/* 01 Verse */}
          <Card label="01 — Choose verse">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <FieldLabel>Surah</FieldLabel>
                <select className="form-input" value={surahIdx}
                  onChange={e => changeSurah(Number(e.target.value))}>
                  {SURAHS.map((s, i) => (
                    <option key={s.n} value={i}>{s.n}. {s.e} ({s.v}v.)</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <FieldLabel>From</FieldLabel>
                <input type="number" className="form-input" min={1} max={surah.v} value={verseFrom}
                  onChange={e => {
                    const v = clamp(Number(e.target.value), 1, surah.v)
                    setVerseFrom(v)
                    if (verseTo < v) setVerseTo(v)
                    setVerses(null)
                  }} />
              </div>
              <div className="w-24">
                <FieldLabel>To</FieldLabel>
                <input type="number" className="form-input"
                  min={verseFrom} max={Math.min(surah.v, verseFrom + 9)} value={verseTo}
                  onChange={e => {
                    setVerseTo(clamp(Number(e.target.value), verseFrom, Math.min(surah.v, verseFrom + 9)))
                    setVerses(null)
                  }} />
              </div>
            </div>

            {/* Basmala info box — shown when surah has basmala as ayah 1 */}
            {hasBasmala && (
              <div className="mt-3 rounded-lg p-3 text-[11px] leading-relaxed"
                style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.2)", color: "var(--muted)" }}>
                <div className="font-semibold mb-1" style={{ color: "var(--gold-light)" }}>
                  ℹ Basmala (Ayah 1)
                </div>
                Dans <strong style={{ color: "var(--text)" }}>{surah.e}</strong>, l'ayah 1 est{" "}
                <strong style={{ color: "var(--text)" }}>Bismillah ir-Rahman ir-Rahim</strong>.
                {" "}Si tu veux inclure la basmala, mets <strong style={{ color: "var(--text)" }}>From = 1</strong>.
                {" "}Sinon commence à <strong style={{ color: "var(--text)" }}>From = 2</strong> pour le premier vrai verset —
                l'audio et le texte seront parfaitement synchronisés dans les deux cas.
              </div>
            )}

            <Hint>2–4 verses = best reel length. Max 10 per video.</Hint>
          </Card>

          {/* 02 Background */}
          <Card label="02 — Video background"
            note={<span style={{ color: "var(--gold)", fontSize: 11 }}>Put your .mp4 files in /public/videos/</span>}>
            <div className="grid grid-cols-3 gap-2.5">
              {BG_VIDEOS.map(bg => (
                <BgCard key={bg.id} bg={bg} active={bgId === bg.id} onClick={() => setBgId(bg.id)} />
              ))}
            </div>
            <AddVideoHint />
          </Card>

          {/* 03 Reciter */}
          <Card label="03 — Reciter">
            <div className="space-y-2">
              {RECITERS.map(r => (
                <button key={r.id} onClick={() => { setRecId(r.id); setVerses(null) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left"
                  style={{
                    background: recId === r.id ? "var(--gold-dim)" : "var(--bg3)",
                    border: `1px solid ${recId === r.id ? "var(--gold)" : "var(--border)"}`,
                  }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium" style={{ color: recId === r.id ? "var(--gold-light)" : "var(--text)" }}>
                        {r.label}
                      </span>
                      {r.viral && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(248,81,73,.15)", color: "var(--red)", border: "1px solid rgba(248,81,73,.3)" }}>
                          🔥 VIRAL
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{r.sub}</div>
                  </div>
                  {recId === r.id && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{ background: "var(--gold)", color: "#000" }}>✓</div>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* 04 Translation */}
          <Card label="04 — Translation">
            <div className="flex flex-wrap gap-2">
              {Object.entries(LANGS).map(([k, label]) => (
                <PillBtn key={k} active={lang === k} onClick={() => { setLang(k); setVerses(null) }}>{label}</PillBtn>
              ))}
            </div>
          </Card>

          {/* Generate */}
          <button onClick={generate} disabled={loading}
            className="w-full py-4 rounded-xl text-[15px] font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
            style={{ background: "var(--gold)", color: "#0a0c10" }}>
            {loading ? <><Spin dark /> Loading verses…</> : <>✦ Generate Reel</>}
          </button>

          {error && (
            <div className="p-3 rounded-lg text-sm"
              style={{ background: "rgba(248,81,73,.1)", border: "1px solid rgba(248,81,73,.3)", color: "var(--red)" }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* ── RIGHT: PLAYER + EXPORT ── */}
        <div className="space-y-4 lg:sticky lg:top-5">
          <PreviewPlayer
            verses={verses}
            surahName={surah.e}
            surahNum={surah.n}
            bgVideo={bgVideo}
            reciter={reciter}
            lang={lang}
            loading={loading}
          />
          {verses && (
            <ExportPanel
              verses={verses}
              surahName={surah.e}
              surahNum={surah.n}
              bgVideo={bgVideo}
              reciter={reciter}
              lang={lang}
            />
          )}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <p className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: "var(--muted)" }}>
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { n:"01", title:"Pick your verse", body:"Choose any surah & verse range. 2–4 verses perform best on TikTok & Reels. Ayah 1 = Basmala for most surahs." },
            { n:"02", title:"Add your videos", body:"Drop .mp4 backgrounds in /public/videos/. Rain, Ka'ba, end-of-times go most viral." },
            { n:"03", title:"Export & post",   body:'Click "Export MP4" — ffmpeg renders everything in your browser. One click, ready to post.' },
          ].map(s => (
            <div key={s.n} className="rounded-xl p-5"
              style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
              <div className="text-[10px] font-bold tracking-widest mb-2" style={{ color: "var(--gold)" }}>STEP {s.n}</div>
              <h3 className="text-[13px] font-medium mb-1">{s.title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--muted)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-5 border-t text-[11px]"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        <p className="font-amiri text-[16px] mb-1" style={{ color: "var(--gold)" }}>اللَّهُمَّ تَقَبَّلْ مِنَّا</p>
        Free forever · No account needed · Made for the Ummah
      </footer>
    </div>
  )
}

// ── ATOMS ─────────────────────────────────────────────────────

function Card({ label, note, children }: { label: string; note?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--muted)" }}>{label}</span>
        {note}
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs mb-1.5" style={{ color: "var(--muted)" }}>{children}</label>
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>💡 {children}</p>
}

function PillBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
      style={{
        border:     active ? "1px solid var(--gold)"   : "1px solid var(--border)",
        background: active ? "var(--gold-dim)"          : "var(--bg3)",
        color:      active ? "var(--gold-light)"        : "var(--muted)",
      }}>
      {children}
    </button>
  )
}

function BgCard({ bg, active, onClick }: { bg: BgVideo; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="relative rounded-xl overflow-hidden transition-all duration-150"
      style={{
        border:     active ? "1.5px solid var(--gold)"  : "1.5px solid var(--border)",
        boxShadow:  active ? "0 0 0 3px var(--gold-dim)" : "none",
        background: "var(--bg3)",
      }}>
      <div className="h-16 relative overflow-hidden flex items-center justify-center" style={{ background: "#000" }}>
        <video src={`/videos/${bg.filename}`}
          className="absolute inset-0 w-full h-full object-cover opacity-75"
          muted loop autoPlay playsInline
          onError={e => { (e.target as HTMLVideoElement).style.display = "none" }} />
        <span className="relative z-10 text-2xl">{bg.emoji}</span>
        {active && (
          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-20"
            style={{ background: "var(--gold)", color: "#000" }}>✓</div>
        )}
      </div>
      <div className="px-2 py-1.5 text-[11px] font-medium text-center border-t"
        style={{ borderColor: "var(--border)", color: active ? "var(--gold)" : "var(--text)" }}>
        {bg.label}
      </div>
    </button>
  )
}

function AddVideoHint() {
  return (
    <div className="mt-3 rounded-lg p-3 text-[11px] leading-relaxed"
      style={{ background: "rgba(201,168,76,.06)", border: "1px solid rgba(201,168,76,.2)", color: "var(--muted)" }}>
      <span style={{ color: "var(--gold-light)", fontWeight: 600 }}>To add videos: </span>
      drop <Code>.mp4</Code> files in <Code>/public/videos/</Code> with names matching above.
      {" "}To add new slots: edit <Code>lib/data.ts</Code> → <Code>BG_VIDEOS</Code>.
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1 rounded text-[10px]" style={{ background: "var(--bg3)", color: "var(--gold)" }}>
      {children}
    </code>
  )
}

export function Spin({ dark }: { dark?: boolean }) {
  return (
    <div className="w-4 h-4 rounded-full border-2 shrink-0"
      style={{
        borderColor:    dark ? "rgba(10,12,16,0.25)" : "var(--border)",
        borderTopColor: dark ? "#0a0c10"             : "var(--gold)",
        animation: "spin 0.65s linear infinite",
      }} />
  )
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }