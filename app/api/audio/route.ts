// app/api/audio/route.ts
import type { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get("url")

  if (!target) {
    return new Response("Missing url parameter", { status: 400 })
  }

  try {
    const u = new URL(target)
    if (!u.hostname.endsWith("everyayah.com")) {
      return new Response("Forbidden target", { status: 403 })
    }
  } catch {
    return new Response("Invalid url", { status: 400 })
  }

  try {
    // Propage l’en‑tête Range pour que le streaming média fonctionne
    const headers = new Headers()
    const range = req.headers.get("range")
    if (range) {
      headers.set("Range", range)
    }

    const upstream = await fetch(target, { headers })

    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream error", { status: upstream.status })
    }

    // On renvoie exactement les mêmes headers (Content-Range, Accept-Ranges, etc.)
    const resHeaders = new Headers(upstream.headers)
    if (!resHeaders.has("Cache-Control")) {
      resHeaders.set("Cache-Control", "public, max-age=31536000, immutable")
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    })
  } catch {
    return new Response("Proxy error", { status: 502 })
  }
}