// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────
export interface Surah   { n: number; e: string; v: number }
export interface Verse   { numberInSurah: number; arabic: string; translation: string }
export interface BgVideo { id: string; label: string; emoji: string; filename: string }
export interface Reciter { id: string; label: string; sub: string; folder: string; viral?: boolean }

// ─────────────────────────────────────────────────────────────
//  SURAHS  (all 114)
// ─────────────────────────────────────────────────────────────
export const SURAHS: Surah[] = [
  {n:1,e:"Al-Fatiha",v:7},{n:2,e:"Al-Baqarah",v:286},{n:3,e:"Ali 'Imran",v:200},
  {n:4,e:"An-Nisa",v:176},{n:5,e:"Al-Ma'idah",v:120},{n:6,e:"Al-An'am",v:165},
  {n:7,e:"Al-A'raf",v:206},{n:8,e:"Al-Anfal",v:75},{n:9,e:"At-Tawbah",v:129},
  {n:10,e:"Yunus",v:109},{n:11,e:"Hud",v:123},{n:12,e:"Yusuf",v:111},
  {n:13,e:"Ar-Ra'd",v:43},{n:14,e:"Ibrahim",v:52},{n:15,e:"Al-Hijr",v:99},
  {n:16,e:"An-Nahl",v:128},{n:17,e:"Al-Isra",v:111},{n:18,e:"Al-Kahf",v:110},
  {n:19,e:"Maryam",v:98},{n:20,e:"Ta-Ha",v:135},{n:21,e:"Al-Anbiya",v:112},
  {n:22,e:"Al-Hajj",v:78},{n:23,e:"Al-Mu'minun",v:118},{n:24,e:"An-Nur",v:64},
  {n:25,e:"Al-Furqan",v:77},{n:26,e:"Ash-Shu'ara",v:227},{n:27,e:"An-Naml",v:93},
  {n:28,e:"Al-Qasas",v:88},{n:29,e:"Al-'Ankabut",v:69},{n:30,e:"Ar-Rum",v:60},
  {n:31,e:"Luqman",v:34},{n:32,e:"As-Sajdah",v:30},{n:33,e:"Al-Ahzab",v:73},
  {n:34,e:"Saba",v:54},{n:35,e:"Fatir",v:45},{n:36,e:"Ya-Sin",v:83},
  {n:37,e:"As-Saffat",v:182},{n:38,e:"Sad",v:88},{n:39,e:"Az-Zumar",v:75},
  {n:40,e:"Ghafir",v:85},{n:41,e:"Fussilat",v:54},{n:42,e:"Ash-Shura",v:53},
  {n:43,e:"Az-Zukhruf",v:89},{n:44,e:"Ad-Dukhan",v:59},{n:45,e:"Al-Jathiyah",v:37},
  {n:46,e:"Al-Ahqaf",v:35},{n:47,e:"Muhammad",v:38},{n:48,e:"Al-Fath",v:29},
  {n:49,e:"Al-Hujurat",v:18},{n:50,e:"Qaf",v:45},{n:51,e:"Adh-Dhariyat",v:60},
  {n:52,e:"At-Tur",v:49},{n:53,e:"An-Najm",v:62},{n:54,e:"Al-Qamar",v:55},
  {n:55,e:"Ar-Rahman",v:78},{n:56,e:"Al-Waqi'ah",v:96},{n:57,e:"Al-Hadid",v:29},
  {n:58,e:"Al-Mujadila",v:22},{n:59,e:"Al-Hashr",v:24},{n:60,e:"Al-Mumtahanah",v:13},
  {n:61,e:"As-Saf",v:14},{n:62,e:"Al-Jumu'ah",v:11},{n:63,e:"Al-Munafiqun",v:11},
  {n:64,e:"At-Taghabun",v:18},{n:65,e:"At-Talaq",v:12},{n:66,e:"At-Tahrim",v:12},
  {n:67,e:"Al-Mulk",v:30},{n:68,e:"Al-Qalam",v:52},{n:69,e:"Al-Haqqah",v:52},
  {n:70,e:"Al-Ma'arij",v:44},{n:71,e:"Nuh",v:28},{n:72,e:"Al-Jinn",v:28},
  {n:73,e:"Al-Muzzammil",v:20},{n:74,e:"Al-Muddaththir",v:56},{n:75,e:"Al-Qiyamah",v:40},
  {n:76,e:"Al-Insan",v:31},{n:77,e:"Al-Mursalat",v:50},{n:78,e:"An-Naba",v:40},
  {n:79,e:"An-Nazi'at",v:46},{n:80,e:"Abasa",v:42},{n:81,e:"At-Takwir",v:29},
  {n:82,e:"Al-Infitar",v:19},{n:83,e:"Al-Mutaffifin",v:36},{n:84,e:"Al-Inshiqaq",v:25},
  {n:85,e:"Al-Buruj",v:22},{n:86,e:"At-Tariq",v:17},{n:87,e:"Al-A'la",v:19},
  {n:88,e:"Al-Ghashiyah",v:26},{n:89,e:"Al-Fajr",v:30},{n:90,e:"Al-Balad",v:20},
  {n:91,e:"Ash-Shams",v:15},{n:92,e:"Al-Layl",v:21},{n:93,e:"Ad-Duhaa",v:11},
  {n:94,e:"Ash-Sharh",v:8},{n:95,e:"At-Tin",v:8},{n:96,e:"Al-'Alaq",v:19},
  {n:97,e:"Al-Qadr",v:5},{n:98,e:"Al-Bayyinah",v:8},{n:99,e:"Az-Zalzalah",v:8},
  {n:100,e:"Al-'Adiyat",v:11},{n:101,e:"Al-Qari'ah",v:11},{n:102,e:"At-Takathur",v:8},
  {n:103,e:"Al-'Asr",v:3},{n:104,e:"Al-Humazah",v:9},{n:105,e:"Al-Fil",v:5},
  {n:106,e:"Quraysh",v:4},{n:107,e:"Al-Ma'un",v:7},{n:108,e:"Al-Kawthar",v:3},
  {n:109,e:"Al-Kafirun",v:6},{n:110,e:"An-Nasr",v:3},{n:111,e:"Al-Masad",v:5},
  {n:112,e:"Al-Ikhlas",v:4},{n:113,e:"Al-Falaq",v:5},{n:114,e:"An-Nas",v:6},
]

// ─────────────────────────────────────────────────────────────
//  BACKGROUND VIDEOS
// ─────────────────────────────────────────────────────────────
export const BG_VIDEOS: BgVideo[] = [
  { id: "rain",       label: "Rain at Night",  emoji: "🌧️", filename: "rain.mp4"       },
  { id: "stars",      label: "Galaxy Sky",     emoji: "✨", filename: "stars.mp4"      },
  { id: "ocean",      label: "Ocean Night",    emoji: "🌊", filename: "ocean.mp4"      },
  { id: "kaba",       label: "Holy Ka'ba",     emoji: "🕋", filename: "kaba.mp4"       },
  { id: "apocalypse", label: "End of Times",   emoji: "🌪️", filename: "apocalypse.mp4" },
  { id: "desert",     label: "Desert Dawn",    emoji: "🌅", filename: "desert.mp4"     },
]

// ─────────────────────────────────────────────────────────────
//  RECITERS
// ─────────────────────────────────────────────────────────────
export const RECITERS: Reciter[] = [
  { id: "dussary", label: "Yasser Ad-Dussary", sub: "Imam Al-Haram · Makkah",    folder: "Yasser_Ad-Dussary_128kbps",     viral: true },
  { id: "afasy",   label: "Mishary Al-Afasy",  sub: "Kuwait · Most loved voice",  folder: "Alafasy_128kbps"                              },
  { id: "maher",   label: "Maher Al-Muaiqly",  sub: "Al-Madinah · Imam",         folder: "MaherAlMuaiqly128kbps"                         },
  { id: "basit",   label: "Abdul Basit",        sub: "Egypt · Classic legend",    folder: "Abdul_Basit_Murattal_192kbps"                  },
]

// ─────────────────────────────────────────────────────────────
//  TRANSLATIONS
// ─────────────────────────────────────────────────────────────
export const LANGS: Record<string, string> = {
  en: "English", fr: "Français", ar: "Arabic only", ur: "Urdu", id: "Indonesian",
}
export const EDITIONS: Record<string, string | null> = {
  en: "en.sahih", fr: "fr.hamidullah", ar: null, ur: "ur.jalandhry", id: "id.indonesian",
}

// ─────────────────────────────────────────────────────────────
//  BASMALA LOGIC
//
//  On everyayah.com, the audio files work like this:
//  - Surah 1  (Al-Fatiha) : ayah 1 = "Bismillah ir-Rahman ir-Rahim" as the 1st verse. The reciters recite it as part of the surah.
//  - Surah 9  (At-Tawbah) : NO basmala. Starts directly at ayah 1.
//  - All other surahs     : ayah 001001.mp3 = Basmala, ayah 001002.mp3 = first real verse.
//
//  IMPORTANT: everyayah.com stores the basmala as a SEPARATE file: 002001.mp3 (for surah 2).
//  This means:
//  - The text API (alquran.cloud) returns ayah 1 = basmala text for most surahs.
//  - The audio API (everyayah.com) has ayah 1 as basmala audio and ayah 2 onward as the verses.
//  - Reciters DO NOT say "Bismillah" again before ayah 2 — the basmala is already ayah 1 audio.
//
//  STRATEGY for sync (matching Quran.com approach):
//  - For surah 1: include everything normally (basmala is part of the surah).
//  - For surah 9: no basmala, start from ayah 1 which is the actual content.
//  - For ALL other surahs: 
//      * If user wants to start from ayah 1 (the basmala), we include it → the audio for that is the basmala recording.
//      * If user starts from ayah N (N >= 2), we display ayah N with its audio → perfect sync.
//      * We NEVER skip the basmala audio while showing the basmala text or vice versa.
//
//  The `effectiveVerseNumber` in getAudioUrl should match exactly what text is shown.
// ─────────────────────────────────────────────────────────────

/**
 * Returns true if this surah has the basmala as ayah 1 in both the text API and audio API.
 * This is true for all surahs except 1 (basmala is part of the surah) and 9 (no basmala).
 */
export function surahHasBasmalaAsAyah1(surahNum: number): boolean {
  return surahNum !== 1 && surahNum !== 9
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Returns the audio URL for a given surah + verse number.
 * The verse number must exactly match what you display in the text — no offset needed.
 * everyayah.com uses the same numbering as alquran.cloud.
 */
export function getAudioUrl(surah: number, verse: number, folder: string): string {
  const rawUrl = `https://everyayah.com/data/${folder}/${String(surah).padStart(3, "0")}${String(verse).padStart(3, "0")}.mp3`
  return `/api/audio?url=${encodeURIComponent(rawUrl)}`
}

export async function fetchVerse(
  surah: number,
  verse: number,
  edition: string | null
): Promise<{ text: string }> {
  const ed = edition ?? "ar.alafasy"
  const r = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/${ed}`)
  const j = await r.json()
  if (j.code !== 200) throw new Error(`API: ${j.status}`)
  return j.data
}

/**
 * Loads verses for a range. Returns an array of Verse objects with correct
 * numberInSurah values so audio playback is perfectly synced with text display.
 * 
 * The returned verse.numberInSurah is always used directly as the audio file index —
 * no remapping needed.
 */
export async function loadVerses(
  surah: number,
  from: number,
  to: number,
  edition: string | null
): Promise<Verse[]> {
  const out: Verse[] = []
  for (let v = from; v <= to; v++) {
    const [ar, tr] = await Promise.all([
      fetchVerse(surah, v, null),
      edition ? fetchVerse(surah, v, edition) : Promise.resolve(null),
    ])
    out.push({
      numberInSurah: v,
      arabic:      ar.text,
      translation: (tr as any)?.text ?? "",
    })
  }
  return out
}