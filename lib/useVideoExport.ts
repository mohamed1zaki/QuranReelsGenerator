"use client"

import { useState, useRef, useCallback } from "react"
import { getAudioUrl, type Verse, type BgVideo, type Reciter } from "@/lib/data"

export type ExportStatus =
  | { phase: "idle" }
  | { phase: "loading_ffmpeg" }
  | { phase: "rendering"; progress: number; label: string }
  | { phase: "done"; url: string; filename: string }
  | { phase: "error"; message: string }

// How many canvas frames per second we render
const FPS = 25

export function useVideoExport() {
  const [status, setStatus] = useState<ExportStatus>({ phase: "idle" })
  const abortRef = useRef(false)

  const exportVideo = useCallback(async (
    verses: Verse[],
    surahName: string,
    surahNum: number,
    bgVideo: BgVideo,
    reciter: Reciter,
    lang: string
  ) => {
    abortRef.current = false
    setStatus({ phase: "loading_ffmpeg" })

    try {
      // ── 1. Dynamic import ffmpeg (avoids SSR issues) ─────────────────────
      const { FFmpeg } = await import("@ffmpeg/ffmpeg")
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util")

      const ffmpeg = new FFmpeg()

      // Load ffmpeg core from CDN
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      })

      setStatus({ phase: "rendering", progress: 0, label: "Fetching audio files…" })

      // ── 2. Download all audio files ───────────────────────────────────────
      // We download each verse MP3 and write to ffmpeg's virtual FS
      const audioDurations: number[] = []

      for (let i = 0; i < verses.length; i++) {
        if (abortRef.current) throw new Error("Cancelled")
        const v = verses[i]
        const url = getAudioUrl(surahNum, v.numberInSurah, reciter.folder)
        setStatus({ phase: "rendering", progress: Math.round((i / verses.length) * 20), label: `Downloading audio ${i + 1}/${verses.length}…` })

        const data = await fetchFile(url)
        await ffmpeg.writeFile(`audio_${i}.mp3`, data)

        // Get duration precisely by decoding audio bytes (avoids metadata drift + concat mp3 gaps)
        const duration = await decodeAudioDurationSeconds(data)
        audioDurations.push(duration)
      }

      // ── 3. Concatenate audio with ffmpeg ─────────────────────────────────
      setStatus({ phase: "rendering", progress: 22, label: "Merging audio tracks…" })

      // concat filter (exact n) → PCM WAV (zero encoder delay, best for sync)
      const concatInputs: string[] = []
      const concatFilterParts: string[] = []
      for (let i = 0; i < verses.length; i++) {
        concatInputs.push("-i", `audio_${i}.mp3`)
        concatFilterParts.push(`[${i}:a]`)
      }
      const concatFilter = `${concatFilterParts.join("")}concat=n=${verses.length}:v=0:a=1[a]`
      await ffmpeg.exec([
        ...concatInputs,
        "-filter_complex", concatFilter,
        "-map", "[a]",
        "-c:a", "pcm_s16le",
        "-ar", "48000",
        "-ac", "2",
        "audio_full.wav",
      ])

      const totalDuration = audioDurations.reduce((a, b) => a + b, 0)
      // Get the REAL duration of the concatenated file (can differ slightly from sum of segments).
      // We'll scale timestamps so overlays match the final audio perfectly.
      const fullWav = (await ffmpeg.readFile("audio_full.wav")) as Uint8Array
      const fullDuration = await decodeAudioDurationSeconds(fullWav)
      const durationScale = fullDuration > 0 && totalDuration > 0 ? fullDuration / totalDuration : 1

      // ── 4. Load background video into ffmpeg FS & render overlay frames ───
      setStatus({ phase: "rendering", progress: 25, label: "Loading background video…" })

      // Put the chosen background MP4 into ffmpeg's virtual FS
      const bgData = await fetchFile(`/videos/${bgVideo.filename}`)
      await ffmpeg.writeFile("bg.mp4", bgData)

      setStatus({ phase: "rendering", progress: 30, label: "Rendering verse overlays…" })

      const W = 1080, H = 1920
      const canvas = document.createElement("canvas")
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext("2d")!

      // Render ONE transparent PNG per verse (massive speedup vs frame-by-frame)
      for (let i = 0; i < verses.length; i++) {
        if (abortRef.current) throw new Error("Cancelled")
        drawVerseOverlay(ctx, W, H, verses, i, surahName, surahNum, lang)
        const bytes = await canvasToPngBytes(canvas)
        await ffmpeg.writeFile(`ov_${i}.png`, bytes)
        setStatus({
          phase: "rendering",
          progress: 30 + Math.round(((i + 1) / verses.length) * 25), // 30 → 55
          label: `Preparing overlay ${i + 1}/${verses.length}…`,
        })
      }

      // ── 5. Encode final MP4: overlay PNG frames on bg.mp4 ─────────────────
      setStatus({ phase: "rendering", progress: 60, label: "Encoding MP4… (ultrafast)" })

      // Build overlay timeline based on cumulative durations
      const starts: number[] = []
      const ends: number[] = []
      let acc = 0
      for (let i = 0; i < verses.length; i++) {
        starts.push(acc * durationScale)
        acc += audioDurations[i] ?? 0
        ends.push(acc * durationScale)
      }

      // Inputs: bg + overlays + audio
      const overlayInputs: string[] = []
      for (let i = 0; i < verses.length; i++) overlayInputs.push("-i", `ov_${i}.png`)

      const filterLines: string[] = []
      filterLines.push("[0:v]scale=1080:1920,setsar=1[bg0]")
      for (let i = 0; i < verses.length; i++) {
        const inIdx = 1 + i // after bg
        filterLines.push(`[${inIdx}:v]format=rgba,scale=1080:1920,setsar=1[ov${i}]`)
      }
      let current = "bg0"
      for (let i = 0; i < verses.length; i++) {
        const out = i === verses.length - 1 ? "v" : `bg${i + 1}`
        filterLines.push(`[${current}][ov${i}]overlay=0:0:enable='between(t,${fmtSeconds(starts[i])},${fmtSeconds(ends[i])})'[${out}]`)
        current = out
      }

      await ffmpeg.exec([
        // background video (looped so it's long enough)
        "-stream_loop", "-1",
        "-i", "bg.mp4",
        ...overlayInputs,
        // full audio (already concatenated)
        "-i", "audio_full.wav",

        "-filter_complex", filterLines.join(";"),

        // map video+audio
        "-map", "[v]",
        "-map", `${1 + verses.length}:a`,

        // Guarantee output ends exactly at end of last verse audio
        "-t", fmtSeconds(fullDuration > 0 ? fullDuration : totalDuration),

        // encoding options (ultra-fast as requested)
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "output.mp4",
      ])

      setStatus({ phase: "rendering", progress: 97, label: "Finalizing…" })

      // ── 6. Read output and create download URL ────────────────────────────
      const outputData = (await ffmpeg.readFile("output.mp4")) as Uint8Array
      // Use a real ArrayBuffer slice (TS + BlobPart compatibility)
      const blob = new Blob([outputData.slice().buffer], { type: "video/mp4" })
      const url = URL.createObjectURL(blob)

      const filename = `quran-${surahName.toLowerCase().replace(/[^a-z]/g, "-")}-${surahNum}-${verses[0].numberInSurah}.mp4`
      setStatus({ phase: "done", url, filename })

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed"
      if (msg !== "Cancelled") {
        setStatus({ phase: "error", message: msg })
      } else {
        setStatus({ phase: "idle" })
      }
    }
  }, [])

  function cancel() {
    abortRef.current = true
    setStatus({ phase: "idle" })
  }

  function reset() {
    setStatus({ phase: "idle" })
  }

  return { status, exportVideo, cancel, reset }
}

// ─────────────────────────────────────────────────────────────
//  FRAME DRAWING  (1080×1920)
// ─────────────────────────────────────────────────────────────
function drawVerseOverlay(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  verses: Verse[],
  idx: number,
  surahName: string,
  surahNum: number,
  lang: string
) {
  // Clear any previous content — background will come from the 4K video via ffmpeg overlay
  ctx.clearRect(0, 0, W, H)

  const verse = verses[idx]
  if (!verse) return

  // IMPORTANT (Strict intro removal):
  // We do NOT render any fixed "intro" text (Bismillah/title/header/branding).
  // Only render the verse text itself (and optional translation), so the overlay mirrors the audio.

  // ── Arabic text ──────────────────────────────────────────────
  ctx.save()
  ctx.direction = "rtl"
  ctx.textAlign = "center"
  ctx.font = "700 90px serif"
  const aLines = wrapText(ctx, verse.arabic, W - 180)
  const totalAH = aLines.length * 128
  const aStartY = (H - totalAH) / 2 - (lang !== "ar" && verse.translation ? 80 : 0)

  aLines.forEach((line, i) => {
    const y = aStartY + i * 128
    // Shadow pass
    ctx.shadowColor = "rgba(0,0,0,0.95)"
    ctx.shadowBlur = 45
    ctx.fillStyle = "#f2e5b0"
    ctx.fillText(line, W / 2, y)
    // Gold glow pass
    ctx.save()
    ctx.shadowColor = "rgba(201,168,76,0.18)"
    ctx.shadowBlur = 60
    ctx.fillStyle = "#f2e5b0"
    ctx.fillText(line, W / 2, y)
    ctx.restore()
  })
  ctx.restore()

  // ── Translation ──────────────────────────────────────────────
  if (lang !== "ar" && verse.translation) {
    const trY = aStartY + aLines.length * 128 + 55
    ctx.save()
    ctx.direction = "ltr"
    ctx.textAlign = "center"
    ctx.font = "300 46px sans-serif"
    ctx.shadowColor = "rgba(0,0,0,0.95)"
    ctx.shadowBlur = 22

    const tLines = wrapText(ctx, `"${verse.translation}"`, W - 210)
    tLines.slice(0, 6).forEach((line, i) => {
      ctx.fillStyle = `rgba(215,222,232,${Math.max(0.55, 0.88 - i * 0.08)})`
      ctx.fillText(line, W / 2, trY + i * 68)
    })
    ctx.restore()
  }
}

function goldLine(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  const g = ctx.createLinearGradient(x1, y, x2, y)
  g.addColorStop(0, "transparent")
  g.addColorStop(0.15, "rgba(201,168,76,0.7)")
  g.addColorStop(0.85, "rgba(201,168,76,0.7)")
  g.addColorStop(1, "transparent")
  ctx.fillStyle = g
  ctx.fillRect(x1, y, x2 - x1, 1.5)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const test = line + w + " "
    if (ctx.measureText(test).width > maxW && line) { lines.push(line.trim()); line = w + " " }
    else line = test
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

async function decodeAudioDurationSeconds(data: Uint8Array): Promise<number> {
  // WebAudio gives the decoded duration (more reliable than <audio> metadata for timing).
  // IMPORTANT: Create a short-lived AudioContext to avoid keeping resources open.
  const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
  if (!AudioCtx) return 5
  const ctx = new AudioCtx()
  try {
    // Make a dedicated ArrayBuffer copy (decodeAudioData expects ArrayBuffer, not SharedArrayBuffer).
    const copy = new Uint8Array(data.byteLength)
    copy.set(data)
    const buf = await ctx.decodeAudioData(copy.buffer)
    const d = Number.isFinite(buf.duration) && buf.duration > 0 ? buf.duration : 5
    return d
  } catch {
    return 5
  } finally {
    try { await ctx.close() } catch {}
  }
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  })
  const ab = await blob.arrayBuffer()
  return new Uint8Array(ab)
}

function fmtSeconds(s: number): string {
  // ffmpeg expression-friendly: fixed decimals, dot separator
  const v = Number.isFinite(s) && s > 0 ? s : 0
  return v.toFixed(3)
}
