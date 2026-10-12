import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOfflineDownload } from "./useOfflineDownload";

const AUTO_DOWNLOAD_INIT_KEY = "has_completed_initial_auto_download_v2";

// Priority core hadith collections for instant offline access
const PRIORITY_HADITH_COLLECTIONS = [
  { id: "bukhari", label: "Sahih al-Bukhari", labelAr: "صحيح البخاري" },
  { id: "muslim", label: "Sahih Muslim", labelAr: "صحيح مسلم" },
  { id: "abudawud", label: "Sunan Abu Dawud", labelAr: "سنن أبي داود" },
  { id: "tirmidhi", label: "Jami' al-Tirmidhi", labelAr: "جامع الترمذي" },
  { id: "nasai", label: "Sunan al-Nasa'i", labelAr: "سنن النسائي" },
  { id: "ibnmajah", label: "Sunan Ibn Majah", labelAr: "سنن ابن ماجه" },
  { id: "muwatta", label: "Muwatta Imam Malik", labelAr: "موطأ الإمام مالك" },
  { id: "muwatta-muhammad", label: "Muwatta Imam Muhammad (Hanafi)", labelAr: "موطأ الإمام محمد" },
  { id: "tahawi", label: "Sharh Ma'ani al-Athar", labelAr: "شرح معاني الآثار للطحاوي" },
  { id: "darimi", label: "Sunan al-Darimi", labelAr: "سنن الدارمي" },
  { id: "musnad-ahmad", label: "Musnad Ahmad ibn Hanbal", labelAr: "مسند أحمد" },
  { id: "musannaf-ibn-abi-shaybah", label: "Musannaf Ibn Abi Shaybah", labelAr: "المصنف لابن أبي شيبة" },
  { id: "musannaf-abdur-razzaq", label: "Musannaf Abd al-Razzaq", labelAr: "المصنف لعبد الرزاق" },
  { id: "mustadrak-hakim", label: "Al-Mustadrak lil-Hakim", labelAr: "المستدرك للحاكم" },
  { id: "sunan-bayhaqi", label: "Al-Sunan al-Kubra lil-Bayhaqi", labelAr: "السنن الكبرى للبيهقي" },
  { id: "kitab-al-athar-abu-yusuf", label: "Kitab al-Athar (Abu Yusuf)", labelAr: "كتاب الآثار لأبي يوسف" },
  { id: "kitab-al-athar-shaybani", label: "Kitab al-Athar (Shaybani)", labelAr: "كتاب الآثار للشيباني" },
  { id: "mushkil-al-athar", label: "Sharh Mushkil al-Athar", labelAr: "مشكل الآثار للطحاوي" },
  { id: "tabarani-kabir", label: "Al-Mu'jam al-Kabir", labelAr: "المعجم الكبير للطبراني" },
  { id: "musnad-abi-yala", label: "Musnad Abi Ya'la", labelAr: "مسند أبي يعلى" },
  { id: "musnad-al-bazzar", label: "Musnad al-Bazzar", labelAr: "مسند البزار" },
  { id: "sunan-saeed-ibn-mansur", label: "Sunan Sa'id ibn Mansur", labelAr: "سنن سعيد بن منصور" },
];

// Essential core Surahs to preload immediately on install
const PRIORITY_SURAHS = [
  { number: 1, label: "Al-Fatihah", labelAr: "الفاتحة" },
  { number: 36, label: "Ya-Sin", labelAr: "يس" },
  { number: 55, label: "Ar-Rahman", labelAr: "الرحمن" },
  { number: 56, label: "Al-Waqi'ah", labelAr: "الواقعة" },
  { number: 67, label: "Al-Mulk", labelAr: "الملك" },
  { number: 112, label: "Al-Ikhlas", labelAr: "الإخلاص" },
  { number: 113, label: "Al-Falaq", labelAr: "الفلق" },
  { number: 114, label: "An-Nas", labelAr: "الناس" },
];

/**
 * useAutoPreload
 * Proactively preloads authentic Islamic Hadith collections, Tafasir, and Surahs
 * upon first launch of the application in the background without user intervention.
 */
export function useAutoPreload() {
  const { downloadHadithCollection, downloadSurah, isDownloaded, getCollectionKey, getSurahKey } = useOfflineDownload();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    async function runAutoPreload() {
      try {
        const isAlreadyDone = await AsyncStorage.getItem(AUTO_DOWNLOAD_INIT_KEY);
        if (isAlreadyDone === "true") return;

        // Auto-download priority surahs in background
        for (const surah of PRIORITY_SURAHS) {
          const key = getSurahKey(surah.number);
          if (!isDownloaded(key)) {
            try {
              await downloadSurah(surah.number, surah.label, surah.labelAr);
            } catch {}
          }
        }

        // Auto-download priority hadith collections sequentially
        for (const col of PRIORITY_HADITH_COLLECTIONS) {
          const key = getCollectionKey(col.id);
          if (!isDownloaded(key)) {
            try {
              await downloadHadithCollection(col.id, col.label, col.labelAr);
            } catch {}
          }
        }

        await AsyncStorage.setItem(AUTO_DOWNLOAD_INIT_KEY, "true");
      } catch {
        // Silent background worker
      }
    }

    // Delay 3 seconds after mount so app starts silky smooth
    const timer = setTimeout(() => {
      runAutoPreload();
    }, 3000);

    return () => clearTimeout(timer);
  }, [downloadHadithCollection, downloadSurah, isDownloaded, getCollectionKey, getSurahKey]);
}
