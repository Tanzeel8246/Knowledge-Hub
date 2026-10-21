import { HadithItem, HadithBook } from "@/constants/hadithData";
import { shamelaStorage } from "./shamelaStorage";

const HADITH_CDN_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";
const ALQURAN_CLOUD_BASE = "https://api.alquran.cloud/v1";

// Mapping of internal collection IDs to CDN edition prefixes
const CDN_COLLECTION_MAP: Record<string, string> = {
  bukhari: "bukhari",
  muslim: "muslim",
  abudawud: "abudawud",
  tirmidhi: "tirmidhi",
  nasai: "nasai",
  ibnmajah: "ibnmajah",
  malik: "malik",
};

export interface ExternalHadithSection {
  collectionId: string;
  bookNumber: number;
  bookName: string;
  hadiths: HadithItem[];
}

/**
 * Fetches full Arabic text and Urdu translation for a specific section/book of a Hadith collection.
 * Merges them by hadith number and caches them locally into shamelaStorage for permanent offline reading.
 */
export async function fetchHadithSection(
  collectionId: string,
  bookNumber: number
): Promise<HadithItem[]> {
  const cdnKey = CDN_COLLECTION_MAP[collectionId];
  if (!cdnKey) return [];

  try {
    const araUrl = `${HADITH_CDN_BASE}/editions/ara-${cdnKey}/sections/${bookNumber}.json`;
    const urdUrl = `${HADITH_CDN_BASE}/editions/urd-${cdnKey}/sections/${bookNumber}.json`;
    const engUrl = `${HADITH_CDN_BASE}/editions/eng-${cdnKey}/sections/${bookNumber}.json`;

    const [araRes, urdRes] = await Promise.all([
      fetch(araUrl).catch(() => null),
      fetch(urdUrl).catch(() => null),
    ]);

    let araJson: any = null;
    let urdJson: any = null;

    if (araRes && araRes.ok) {
      araJson = await araRes.json().catch(() => null);
    }
    if (urdRes && urdRes.ok) {
      urdJson = await urdRes.json().catch(() => null);
    }

    // If Urdu is not available for this collection, try English fallback
    let engJson: any = null;
    if (!urdJson) {
      const engRes = await fetch(engUrl).catch(() => null);
      if (engRes && engRes.ok) {
        engJson = await engRes.json().catch(() => null);
      }
    }

    if (!araJson?.hadiths && !urdJson?.hadiths) {
      return [];
    }

    const araHadiths: any[] = araJson?.hadiths ?? [];
    const urdHadiths: any[] = urdJson?.hadiths ?? [];
    const engHadiths: any[] = engJson?.hadiths ?? [];

    // Map by hadith number
    const urdMap = new Map<number, any>();
    for (const h of urdHadiths) {
      if (h.hadithnumber != null) urdMap.set(Number(h.hadithnumber), h);
    }

    const engMap = new Map<number, any>();
    for (const h of engHadiths) {
      if (h.hadithnumber != null) engMap.set(Number(h.hadithnumber), h);
    }

    const mergedList: HadithItem[] = [];

    const baseList = araHadiths.length > 0 ? araHadiths : urdHadiths;

    for (let i = 0; i < baseList.length; i++) {
      const baseItem = baseList[i];
      const hNum = Number(baseItem.hadithnumber ?? (i + 1));
      const araItem = araHadiths.length > 0 ? (araHadiths[i] ?? baseItem) : null;
      const urdItem = urdMap.get(hNum) ?? urdHadiths[i] ?? null;
      const engItem = engMap.get(hNum) ?? engHadiths[i] ?? null;

      // Extract grade if available
      let gradeStr: string | undefined = undefined;
      const grades = baseItem.grades ?? araItem?.grades ?? urdItem?.grades;
      if (Array.isArray(grades) && grades.length > 0) {
        const primary = grades.find((g: any) => g.grade) ?? grades[0];
        gradeStr = primary?.grade;
      }

      const item: HadithItem = {
        id: `${collectionId}_${bookNumber}_${hNum}`,
        collectionId,
        bookNumber,
        hadithNumber: hNum,
        arabic: araItem?.text ?? "",
        urdu: urdItem?.text ?? "",
        english: engItem?.text ?? undefined,
        narrator: extractNarrator(araItem?.text ?? urdItem?.text ?? ""),
        grade: gradeStr,
        reference: `${capitalize(collectionId)}: ${hNum}`,
      };

      mergedList.push(item);
    }

    return mergedList;
  } catch {
    return [];
  }
}

/**
 * Fetches section/book list for a Hadith collection from the open CDN.
 */
export async function fetchCollectionBooks(collectionId: string): Promise<HadithBook[]> {
  const cdnKey = CDN_COLLECTION_MAP[collectionId];
  if (!cdnKey) return [];

  try {
    const infoUrl = `${HADITH_CDN_BASE}/info.json`;
    const res = await fetch(infoUrl);
    if (!res.ok) return [];

    const data = await res.json();
    const colInfo = data[cdnKey];
    if (!colInfo?.metadata?.sections) return [];

    const sections = colInfo.metadata.sections;
    const sectionDetails = colInfo.metadata.section_details ?? {};

    const books: HadithBook[] = [];

    for (const [secKey, secName] of Object.entries(sections)) {
      const bNum = Number(secKey);
      if (bNum === 0 || !secName) continue; // Skip intro/0 section

      const details = sectionDetails[secKey];
      const hadithCount = details
        ? Math.max(1, (details.hadithnumber_last - details.hadithnumber_first + 1))
        : 50;

      books.push({
        collectionId,
        bookNumber: bNum,
        nameEnglish: String(secName),
        nameArabic: details?.arabicname ?? undefined,
        totalHadiths: hadithCount,
      });
    }

    return books.sort((a, b) => a.bookNumber - b.bookNumber);
  } catch {
    return [];
  }
}

/**
 * Fetches Tafsir for a specific Surah (e.g. Tafsir al-Jalalayn).
 */
export async function fetchSurahTafsir(
  surahNumber: number,
  editionKey: string = "ar.jalalayn"
): Promise<{ surahNumber: number; ayahs: { number: number; text: string; tafsir: string }[] } | null> {
  try {
    const url = `${ALQURAN_CLOUD_BASE}/surah/${surahNumber}/editions/${editionKey},quran-uthmani`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    if (json.code !== 200 || !json.data) return null;

    const tafsirData = json.data[0];
    const quranData = json.data[1];

    const ayahs = (tafsirData.ayahs ?? []).map((tAyah: any, idx: number) => {
      const qAyah = quranData?.ayahs?.[idx];
      return {
        number: tAyah.numberInSurah ?? (idx + 1),
        text: qAyah?.text ?? "",
        tafsir: tAyah.text ?? "",
      };
    });

    return {
      surahNumber,
      ayahs,
    };
  } catch {
    return null;
  }
}

function extractNarrator(text: string): string | undefined {
  if (!text) return undefined;
  // Check common Arabic narrator patterns
  const matchAr = text.match(/عَنْ\s+([\u0621-\u064A\s]+?)(?:رضي|قَالَ|أَنَّ|أَنَّهُ)/);
  if (matchAr && matchAr[1] && matchAr[1].trim().length < 40) {
    return matchAr[1].trim();
  }
  // Check common Urdu narrator patterns
  const matchUr = text.match(/(?:حضرت\s+)?([\u0621-\u064A\s]+?)\s*(?:رضی اللہ عنہ|فرماتے ہیں|سے روایت ہے)/);
  if (matchUr && matchUr[1] && matchUr[1].trim().length < 40) {
    return matchUr[1].trim();
  }
  return undefined;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
