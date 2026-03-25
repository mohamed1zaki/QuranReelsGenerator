"use client"

import { useVideoExport } from "@/lib/useVideoExport"
import { type Verse, type BgVideo, type Reciter } from "@/lib/data"

interface Props {
  verses: Verse[]
  surahName: string
  surahNum: number
  bgVideo: BgVideo
  reciter: Reciter
  lang: string
}

export default function ExportPanel({ verses, surahName, surahNum, bgVideo, reciter, lang }: Props) {
  const { status, exportVideo, cancel, reset } = useVideoExport()

  function start() {
    exportVideo(verses, surahName, surahNum, bgVideo, reciter, lang)
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>

      <div className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: "var(--border)" }}>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
          Export Video
        </span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(63,185,80,.1)", color: "var(--green)", border: "1px solid rgba(63,185,80,.2)" }}>
          Real MP4
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* IDLE */}
        {status.phase === "idle" && (
          <>
            <div className="text-[12px] space-y-1.5" style={{ color: "var(--muted)" }}>
              <p>Generates a <strong style={{ color: "var(--text)" }}>full MP4 video</strong> with:</p>
              <ul className="space-y-1 ml-3">
                <li>✓ Your background video</li>
                <li>✓ Verse-by-verse Arabic text</li>
                <li>✓ Translation overlay</li>
                <li>✓ Recitation audio ({reciter.label})</li>
                <li>✓ 1080×1920 — ready to post</li>
              </ul>
              <p className="mt-2 text-[11px]">
                Processing happens <strong style={{ color: "var(--text)" }}>in your browser</strong> — no upload, no server.
                Takes ~30–90s depending on verse count.
              </p>
            </div>
            <button onClick={start}
              className="w-full py-3.5 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: "var(--gold)", color: "#0a0c10" }}>
              ⬇ Export MP4
            </button>
          </>
        )}

        {/* LOADING FFMPEG */}
        {status.phase === "loading_ffmpeg" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Spinner />
              <div>
                <p className="text-[13px] font-medium">Loading video encoder…</p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Downloading ffmpeg (~10 MB) — only once per session
                </p>
              </div>
            </div>
            <ProgressBar value={5} />
            <CancelBtn onClick={cancel} />
          </div>
        )}

        {/* RENDERING */}
        {status.phase === "rendering" && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Spinner />
              <div className="min-w-0">
                <p className="text-[13px] font-medium">Rendering…</p>
                <p className="text-[11px] truncate" style={{ color: "var(--muted)" }}>{status.label}</p>
              </div>
              <span className="text-[13px] font-bold shrink-0" style={{ color: "var(--gold)" }}>
                {status.progress}%
              </span>
            </div>
            <ProgressBar value={status.progress} />

            {/* Phase hints */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
              {[
                { label: "Audio",   done: status.progress >= 22 },
                { label: "Frames",  done: status.progress >= 80 },
                { label: "Encode",  done: status.progress >= 97 },
              ].map(s => (
                <div key={s.label} className="rounded-lg py-1.5 px-2 font-medium"
                  style={{
                    background: s.done ? "rgba(63,185,80,.12)" : "var(--bg3)",
                    border: `1px solid ${s.done ? "rgba(63,185,80,.3)" : "var(--border)"}`,
                    color: s.done ? "var(--green)" : "var(--muted)",
                  }}>
                  {s.done ? "✓ " : ""}{s.label}
                </div>
              ))}
            </div>

            <CancelBtn onClick={cancel} />
          </div>
        )}

        {/* DONE */}
        {status.phase === "done" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--green)" }}>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Video ready!
            </div>

            {/* Inline preview of the generated MP4 */}
            <video
              src={status.url}
              controls
              className="w-full rounded-xl"
              style={{ maxHeight: 360, backgroundColor: "#000" }}
            />

            <a href={status.url} download={status.filename}
              className="w-full py-3.5 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: "var(--green)", color: "#fff", textDecoration: "none" }}>
              ⬇ Download MP4
            </a>

            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              File: <code className="text-[10px] px-1 rounded" style={{ background: "var(--bg3)", color: "var(--gold)" }}>{status.filename}</code>
            </p>

            <button onClick={reset}
              className="w-full py-2 rounded-lg text-xs font-medium"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted)" }}>
              Export another version
            </button>
          </div>
        )}

        {/* ERROR */}
        {status.phase === "error" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg text-[12px]"
              style={{ background: "rgba(248,81,73,.1)", border: "1px solid rgba(248,81,73,.3)", color: "var(--red)" }}>
              ⚠ {status.message}
            </div>
            <button onClick={reset}
              className="w-full py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)" }}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
      <div className="h-full rounded-full transition-all duration-300"
        style={{ width: `${value}%`, background: "linear-gradient(to right, var(--gold), var(--gold-light))" }} />
    </div>
  )
}

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 shrink-0"
      style={{ borderColor: "var(--border)", borderTopColor: "var(--gold)", animation: "spin 0.65s linear infinite" }} />
  )
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full py-2 rounded-lg text-xs font-medium"
      style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted)" }}>
      Cancel
    </button>
  )
}