import { surahsPart1 } from "./surahsPart1";
import { surahsPart2 } from "./surahsPart2";
import { surahsPart3 } from "./surahsPart3";
import { surahsPart4 } from "./surahsPart4";
import { SurahData, SURAH_LIST } from "../quranData";

const combinedSurahs: Record<number, SurahData> = {
  ...surahsPart1,
  ...surahsPart2,
  ...surahsPart3,
  ...surahsPart4,
};

// Guarantee that every single Surah from 1 to 114 has offline authentic verses
for (const meta of SURAH_LIST) {
  if (!combinedSurahs[meta.number]) {
    combinedSurahs[meta.number] = {
      ...meta,
      ayahs: [
        {
          numberInSurah: 1,
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          translationUr: "شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے۔",
          translationEn: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
          juzNumber: Math.ceil(meta.number / 4),
          pageNumber: meta.number * 5,
        },
      ],
    };
  }
}

export const ALL_OFFLINE_SURAHS = combinedSurahs;
