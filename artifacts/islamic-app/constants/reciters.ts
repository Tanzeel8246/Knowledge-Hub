export interface Reciter {
  id: string;
  name: string;
  nameArabic: string;
  country: string;
  style: "Murattal" | "Mujawwad" | "Muallim";
  folder: string;
  description: string;
}

// everyayah.com folder names for URL construction
// Audio URL: https://everyayah.com/data/{folder}/{surah_padded}{ayah_padded}.mp3
// e.g. Surah 1 Ayah 1 → 001001.mp3

export const RECITERS: Reciter[] = [
  {
    id: "alafasy",
    name: "Mishary Rashid Alafasy",
    nameArabic: "مشاري بن راشد العفاسي",
    country: "Kuwait",
    style: "Murattal",
    folder: "Alafasy_128kbps",
    description: "One of the most popular reciters in the world, known for his beautiful and melodious voice.",
  },
  {
    id: "abdulbasit_murattal",
    name: "Abdul Basit Abdul Samad (Murattal)",
    nameArabic: "عبد الباسط عبد الصمد",
    country: "Egypt",
    style: "Murattal",
    folder: "Abdul_Basit_Murattal_192kbps",
    description: "Legendary Egyptian reciter, considered one of the greatest Quran reciters of the 20th century.",
  },
  {
    id: "abdulbasit_mujawwad",
    name: "Abdul Basit Abdul Samad (Mujawwad)",
    nameArabic: "عبد الباسط عبد الصمد (المجود)",
    country: "Egypt",
    style: "Mujawwad",
    folder: "Abdul_Basit_Mujawwad_128kbps",
    description: "Artful, ornamented recitation style from the legendary Egyptian master.",
  },
  {
    id: "sudais",
    name: "Abdurrahman As-Sudais",
    nameArabic: "عبد الرحمن السديس",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Abdurrahmaan_As-Sudais_192kbps",
    description: "Imam of Masjid al-Haram in Makkah — one of the world's most recognized voices.",
  },
  {
    id: "shuraim",
    name: "Yusuf Al-Shuraim",
    nameArabic: "يوسف بن صالح الشريم",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Yusuf_AlShareem_128kbps",
    description: "Imam of Masjid al-Haram, known for his deep voice and measured recitation.",
  },
  {
    id: "muaiqly",
    name: "Maher Al-Muaiqly",
    nameArabic: "ماهر المعيقلي",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "MaherAlMuaiqly128kbps",
    description: "Imam of Masjid al-Haram, beloved for his calm and soothing recitation style.",
  },
  {
    id: "hussary",
    name: "Mahmoud Khalil Al-Hussary",
    nameArabic: "محمود خليل الحصري",
    country: "Egypt",
    style: "Muallim",
    folder: "Husary_128kbps",
    description: "Master of tajweed rules, his recitation is widely used for learning proper pronunciation.",
  },
  {
    id: "minshawi",
    name: "Mohamed Siddiq Al-Minshawi",
    nameArabic: "محمد صديق المنشاوي",
    country: "Egypt",
    style: "Murattal",
    folder: "Minshawi_Murattal_128kbps",
    description: "Egyptian master with a deeply moving and emotional recitation style.",
  },
  {
    id: "ghamdi",
    name: "Saad Al-Ghamdi",
    nameArabic: "سعد الغامدي",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Ghamadi_40kbps",
    description: "Widely listened imam known for his clear and precise Murattal recitation.",
  },
  {
    id: "hani_rifai",
    name: "Hani Ar-Rifai",
    nameArabic: "هاني الرفاعي",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Hani_Rifai_192kbps",
    description: "Beloved Saudi reciter with a warm, gentle recitation style.",
  },
  {
    id: "huthaify",
    name: "Ali Abdur-Rahman Al-Huthaify",
    nameArabic: "علي عبد الرحمن الحذيفي",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Ali_Huthaify_64kbps",
    description: "Imam of Masjid an-Nabawi in Madinah, known for his serene voice.",
  },
  {
    id: "qatami",
    name: "Nasser Al-Qatami",
    nameArabic: "ناصر القطامي",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Nasser_Alqatami_128kbps",
    description: "Popular reciter known for a clear, emotional style in night prayers.",
  },
  {
    id: "basfar",
    name: "Abdullah Basfar",
    nameArabic: "عبدالله بصفر",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Abdullah_Basfar_128kbps",
    description: "Saudi reciter known for his measured recitation and excellent tajweed.",
  },
  {
    id: "ajamy",
    name: "Ahmad Al-Ajamy",
    nameArabic: "أحمد بن علي العجمي",
    country: "Kuwait",
    style: "Murattal",
    folder: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah",
    description: "Kuwaiti reciter renowned for his beautiful voice and emotional delivery.",
  },
  {
    id: "ibrahim_akhdar",
    name: "Ibrahim Al-Akhdar",
    nameArabic: "إبراهيم الأخضر",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Ibrahim_Akhdar_128kbps",
    description: "Saudi reciter with a distinctive and melodious style, popular in Taraweeh prayers.",
  },
  {
    id: "khalid_qahtani",
    name: "Khalid Al-Qahtani",
    nameArabic: "خالد القحطاني",
    country: "Saudi Arabia",
    style: "Murattal",
    folder: "Khalid_Qahtani_128kbps",
    description: "Saudi reciter known for his clear and heartfelt style of recitation.",
  },
  {
    id: "faris_abbad",
    name: "Fares Abbad",
    nameArabic: "فارس عبّاد",
    country: "Algeria",
    style: "Murattal",
    folder: "Fares_Abbad_64kbps",
    description: "Algerian reciter with a powerful and emotionally resonant voice.",
  },
  {
    id: "tablawi",
    name: "Muhammad Al-Tablawi",
    nameArabic: "محمد الطبلاوي",
    country: "Egypt",
    style: "Mujawwad",
    folder: "Muhammad_Jibreel_128kbps",
    description: "One of the great Egyptian reciters with a majestic Mujawwad style.",
  },
];

export const DEFAULT_RECITER = RECITERS[0];

export function getAudioUrl(folder: string, surah: number, ayah: number): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

export function getSurahAudioUrl(folder: string, surah: number): string {
  const s = String(surah).padStart(3, "0");
  return `https://everyayah.com/data/${folder}/${s}001.mp3`;
}
