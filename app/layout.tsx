import type { Metadata } from "next"
import { Amiri, Outfit } from "next/font/google"
import "./globals.css"

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap",
})

const outfit = Outfit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Quran Reels — Free Viral Video Generator",
  description: "Create beautiful Quran short videos with Arabic text, translation and recitation. Verse by verse, synchronized. Free & unlimited.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${amiri.variable} ${outfit.variable} antialiased`}>{children}</body>
    </html>
  )
}
