"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { getAudioUrl, type Verse, type BgVideo, type Reciter } from "@/lib/data"

interface Props {
  verses: Verse[] | null
  surahName: string
  surahNum: number
  bgVideo: BgVideo
  reciter: Reciter
  lang: string
  loading: boolean
}

type AudioState = "idle" | "loading" | "ready" | "error"

export default function PreviewPlayer({
  verses,
  surahName,
  surahNum,
  bgVideo,
  reciter,
  lang,
  loading,
}: Props) {
  const [idx, setIdx]               = useState(0)
  const [playing, setPlaying]       = useState(false)
  const [ended, setEnded]           = useState(false)
  const [bgErr, setBgErr]           = useState(false)
  const [audioState, setAudioState] = useState<AudioState>("idle")
  const [visible, setVisible]       = useState(true)
  const [progress, setProgress]     = useState(0) // 0..1 within current verse

  const audioRef    = useRef<HTMLAudioElement>(null)
  const bgRef       = useRef<HTMLVideoElement>(null)
  const rafRef      = useRef<number>(0)

  /* ─── reset whenever verses/reciter change ─── */
  useEffect(() => {
    setIdx(0)
    setPlaying(false)
    setEnded(false)
    setVisible(true)
    setProgress(0)
    setAudioState("idle")
    cancelAnimationFrame(rafRef.current)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    if (bgRef.current) {
      bgRef.current.pause()
      bgRef.current.currentTime = 0
    }
  }, [verses, reciter])

  /* ─── load a specific verse's audio ─── */
  const loadAudio = useCallback(
    (i: number) => {
      const audio = audioRef.current
      if (!audio || !verses) return
      audio.pause()
      setAudioState("loading")
      setProgress(0)
      const url = getAudioUrl(surahNum, verses[i].numberInSurah, reciter.folder)
      audio.src = url
      audio.load()
    },
    [verses, surahNum, reciter.folder]
  )

  /* ─── audio event listeners ─── */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onReady   = () => setAudioState("ready")
    const onError   = () => setAudioState("error")
    const onPlaying = () => setPlaying(true)
    const onPause   = () => setPlaying(false)
    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration)
      }
    }

    audio.addEventListener("canplay",        onReady)
    audio.addEventListener("canplaythrough", onReady)
    audio.addEventListener("loadeddata",     onReady)
    audio.addEventListener("loadedmetadata", onReady)
    audio.addEventListener("error",          onError)
    audio.addEventListener("playing",        onPlaying)
    audio.addEventListener("pause",          onPause)
    audio.addEventListener("timeupdate",     onTimeUpdate)

    const t = setTimeout(() => {
      setAudioState(prev => (prev === "loading" ? "error" : prev))
    }, 8000)

    return () => {
      clearTimeout(t)
      audio.removeEventListener("canplay",        onReady)
      audio.removeEventListener("canplaythrough", onReady)
      audio.removeEventListener("loadeddata",     onReady)
      audio.removeEventListener("loadedmetadata", onReady)
      audio.removeEventListener("error",          onError)
      audio.removeEventListener("playing",        onPlaying)
      audio.removeEventListener("pause",          onPause)
      audio.removeEventListener("timeupdate",     onTimeUpdate)
    }
  }, [verses])

  /* ─── load first verse once verses arrive ─── */
  useEffect(() => {
    if (verses && verses.length > 0) loadAudio(0)
  }, [verses, loadAudio])

  /* ─── sync bg-video with audio ─── */
  useEffect(() => {
    const video = bgRef.current
    if (!video) return
    if (playing) { video.play().catch(() => {}) }
    else         { video.pause() }
  }, [playing])

  /* ─── play / pause ─── */
  async function play() {
    const audio = audioRef.current
    if (!audio || !verses) return

    if (ended) {
      setIdx(0); setVisible(true); setEnded(false); setProgress(0)
      loadAudio(0)
      await new Promise(r => setTimeout(r, 80))
    }

    try {
      await audio.play()
      bgRef.current?.play().catch(() => {})
    } catch {
      setAudioState("error")
    }
  }

  function pause() {
    audioRef.current?.pause()
    bgRef.current?.pause()
  }

  /* ─── advance to next verse on end ─── */
  function handleAudioEnded() {
    if (!verses) return
    const next = idx + 1
    setProgress(0)
    if (next < verses.length) {
      setVisible(false)
      setTimeout(() => {
        setIdx(next)
        setVisible(true)
        loadAudio(next)
        // Small settle delay, then play
        setTimeout(() => {
          audioRef.current?.play().catch(() => {})
        }, 60)
      }, 350)
    } else {
      setPlaying(false)
      setEnded(true)
      bgRef.current?.pause()
    }
  }

  const verse = verses?.[idx]

  /* ─── empty state ─── */
  if (!verses && !loading) {
    return (
      <div className="rounded-2xl flex items-center justify-center text-center px-8 w-full max-w-[340px] mx-auto"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", aspectRatio: "9/16", maxHeight: 520 }}>
        <div className="space-y-3">
          <p className="font-amiri text-5xl" style={{ color: "var(--gold)" }}>ق</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Configurez les paramètres puis<br />
            <strong style={{ color: "var(--text)" }}>Générez le Reel</strong>
          </p>
        </div>
      </div>
    )
  }

  /* ─── loading state ─── */
  if (loading) {
    return (
      <div className="rounded-2xl flex items-center justify-center w-full max-w-[340px] mx-auto"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", aspectRatio: "9/16", maxHeight: 520 }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 mx-auto"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--gold)", animation: "spin 0.7s linear infinite" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Chargement des versets…</p>
        </div>
      </div>
    )
  }

  /* ─── main player ─── */
  return (
    <div className="w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)", boxShadow: "0 20px 50px rgba(0,0,0,.45)", background: "#000" }}>

      {/* ── VIDEO AREA ── */}
      <div className="relative w-full" style={{ aspectRatio: "9/16", maxHeight: 520, background: "#000", overflow: "hidden" }}>

        {/* Background video */}
        <video ref={bgRef} src={`/videos/${bgVideo.filename}`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: bgErr ? 0 : 1, transition: "opacity .3s" }}
          muted loop playsInline preload="metadata"
          onError={() => setBgErr(true)} />

        {/* Fallback gradient */}
        {bgErr && (
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(160deg,#020510 0%,#061025 50%,#020408 100%)" }} />
        )}

        {/* Cinematic overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,.65) 0%, rgba(0,0,0,.15) 35%, rgba(0,0,0,.15) 65%, rgba(0,0,0,.72) 100%)"
        }} />

        {/* ── VERSE TEXT ── */}
        {verse && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
            style={{ opacity: visible ? 1 : 0, transition: "opacity .35s ease" }}>

            {/* Surah reference + progress dots */}
            <div className="absolute top-5 left-0 right-0 flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-medium tracking-widest uppercase"
                style={{ color: "rgba(201,168,76,.8)" }}>
                {surahName} · {surahNum}:{verse.numberInSurah}
              </span>
              <div className="flex gap-1.5 items-center mt-1.5">
                {verses!.map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300" style={{
                    width:  i === idx ? 8 : 4,
                    height: i === idx ? 8 : 4,
                    background: i === idx ? "var(--gold)" : i < idx ? "rgba(201,168,76,.55)" : "rgba(201,168,76,.2)",
                  }} />
                ))}
              </div>
            </div>

            {/* Arabic text */}
            <p className="font-amiri arabic leading-loose mb-5"
              style={{
                fontSize: "clamp(22px, 6vw, 30px)", color: "#f2e5b0",
                textShadow: "0 2px 20px rgba(0,0,0,.97), 0 0 40px rgba(201,168,76,.18)",
                lineHeight: 1.9,
              }}>
              {verse.arabic}
            </p>

            {/* Translation */}
            {lang !== "ar" && verse.translation && (
              <p className="font-light italic leading-relaxed max-w-[260px] mx-auto"
                style={{
                  color: "rgba(215,222,232,.82)",
                  textShadow: "0 2px 12px rgba(0,0,0,.98)",
                  fontSize: "clamp(11px, 2.8vw, 13px)",
                }}>
                &ldquo;{verse.translation}&rdquo;
              </p>
            )}

            {/* Branding */}
            <div className="absolute bottom-5 left-0 right-0 text-center space-y-0.5">
              <p className="font-amiri text-sm" style={{ color: "rgba(201,168,76,.5)" }}>القرآن الكريم</p>
              <p className="text-[9px] tracking-widest" style={{ color: "rgba(130,145,168,.35)" }}>quranreels.app</p>
            </div>
          </div>
        )}

        {/* ── PLAY / PAUSE BUTTON ── */}
        <button
          onClick={playing ? pause : play}
          disabled={audioState === "loading"}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 group"
          aria-label={playing ? "Pause" : ended ? "Rejouer" : "Lire"}
          style={{ cursor: audioState === "loading" ? "wait" : "pointer", background: "transparent", border: "none" }}>

          {/* Show play button only when not playing */}
          {!playing && (
            <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
              style={{
                background: audioState === "loading" ? "rgba(201,168,76,.35)" : "rgba(201,168,76,.88)",
                boxShadow: "0 4px 24px rgba(201,168,76,.35)",
              }}>
              {audioState === "loading" ? (
                <div className="w-5 h-5 rounded-full border-2"
                  style={{ borderColor: "rgba(0,0,0,.3)", borderTopColor: "#000", animation: "spin 0.7s linear infinite" }} />
              ) : ended ? (
                <svg className="w-6 h-6" fill="#000" viewBox="0 0 24 24">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 ml-1" fill="#000" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          )}

          {!playing && audioState !== "loading" && (
            <span className="text-[10px] uppercase tracking-[0.4em]" style={{ color: "rgba(255,255,255,.6)" }}>
              {ended ? "Rejouer" : "Lancer la récitation"}
            </span>
          )}
        </button>

        {/* Missing video warning */}
        {bgErr && (
          <div className="absolute top-3 left-3 right-3 py-1.5 px-3 rounded-lg text-[10px] text-center pointer-events-none"
            style={{ background: "rgba(201,168,76,.1)", border: "1px solid rgba(201,168,76,.25)", color: "var(--gold-light)" }}>
            ⚠ {bgVideo.filename} introuvable dans /public/videos/
          </div>
        )}
      </div>

      {/* ── SLIM PROGRESS BAR + VERSE COUNTER (replaces native audio bar) ── */}
      <div style={{ background: "var(--bg2)", padding: "10px 14px 12px" }}>
        {/* Verse counter */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>
            {audioState === "loading" ? "Chargement…" :
             audioState === "error"   ? "Erreur audio" :
             playing                  ? "En lecture" : "En pause"}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "var(--gold)" }}>
            {idx + 1} / {verses?.length ?? 1}
          </span>
        </div>

        {/* Progress bar (current verse) */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
          <div className="h-full rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%`, background: "linear-gradient(to right, var(--gold), var(--gold-light))" }} />
        </div>

        {/* Playback controls row */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {/* Previous verse */}
          <button
            onClick={() => {
              if (idx > 0) {
                const prev = idx - 1
                setIdx(prev); setVisible(true); setProgress(0)
                loadAudio(prev)
                if (playing) setTimeout(() => audioRef.current?.play().catch(() => {}), 60)
              }
            }}
            disabled={idx === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", opacity: idx === 0 ? 0.3 : 1 }}
            aria-label="Verset précédent">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: "var(--muted)" }}>
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={playing ? pause : play}
            disabled={audioState === "loading"}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all hover:brightness-110"
            style={{ background: "var(--gold)" }}
            aria-label={playing ? "Pause" : "Play"}>
            {audioState === "loading" ? (
              <div className="w-4 h-4 rounded-full border-2"
                style={{ borderColor: "rgba(0,0,0,.25)", borderTopColor: "#0a0c10", animation: "spin 0.7s linear infinite" }} />
            ) : playing ? (
              <svg className="w-5 h-5" fill="#0a0c10" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="#0a0c10" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Next verse */}
          <button
            onClick={() => {
              if (verses && idx < verses.length - 1) {
                const next = idx + 1
                setVisible(false)
                setTimeout(() => {
                  setIdx(next); setVisible(true); setProgress(0)
                  loadAudio(next)
                  if (playing) setTimeout(() => audioRef.current?.play().catch(() => {}), 60)
                }, 350)
              }
            }}
            disabled={!verses || idx >= verses.length - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", opacity: (!verses || idx >= verses.length - 1) ? 0.3 : 1 }}
            aria-label="Verset suivant">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: "var(--muted)" }}>
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hidden audio element — NO controls */}
      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" style={{ display: "none" }} />
    </div>
  )
}