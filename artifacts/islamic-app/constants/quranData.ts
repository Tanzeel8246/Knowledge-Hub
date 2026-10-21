export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameTransliteration: string;
  nameEnglish: string;
  revelationType: "Meccan" | "Medinan";
  totalAyahs: number;
}

export interface Ayah {
  numberInSurah: number;
  arabic: string;
  translationEn: string;
  translationUr: string;
  tafsirEn?: string;
  tafsirUr?: string;
  juzNumber?: number;
  pageNumber?: number;
}

export interface SurahData extends SurahMeta {
  ayahs: Ayah[];
}

export const SURAH_LIST: SurahMeta[] = [
  { number: 1, nameArabic: "الفاتحة", nameTransliteration: "Al-Fatihah", nameEnglish: "The Opening", revelationType: "Meccan", totalAyahs: 7 },
  { number: 2, nameArabic: "البقرة", nameTransliteration: "Al-Baqarah", nameEnglish: "The Cow", revelationType: "Medinan", totalAyahs: 286 },
  { number: 3, nameArabic: "آل عمران", nameTransliteration: "Ali 'Imran", nameEnglish: "Family of Imran", revelationType: "Medinan", totalAyahs: 200 },
  { number: 4, nameArabic: "النساء", nameTransliteration: "An-Nisa", nameEnglish: "The Women", revelationType: "Medinan", totalAyahs: 176 },
  { number: 5, nameArabic: "المائدة", nameTransliteration: "Al-Ma'idah", nameEnglish: "The Table Spread", revelationType: "Medinan", totalAyahs: 120 },
  { number: 6, nameArabic: "الأنعام", nameTransliteration: "Al-An'am", nameEnglish: "The Cattle", revelationType: "Meccan", totalAyahs: 165 },
  { number: 7, nameArabic: "الأعراف", nameTransliteration: "Al-A'raf", nameEnglish: "The Heights", revelationType: "Meccan", totalAyahs: 206 },
  { number: 8, nameArabic: "الأنفال", nameTransliteration: "Al-Anfal", nameEnglish: "The Spoils of War", revelationType: "Medinan", totalAyahs: 75 },
  { number: 9, nameArabic: "التوبة", nameTransliteration: "At-Tawbah", nameEnglish: "The Repentance", revelationType: "Medinan", totalAyahs: 129 },
  { number: 10, nameArabic: "يونس", nameTransliteration: "Yunus", nameEnglish: "Jonah", revelationType: "Meccan", totalAyahs: 109 },
  { number: 11, nameArabic: "هود", nameTransliteration: "Hud", nameEnglish: "Hud", revelationType: "Meccan", totalAyahs: 123 },
  { number: 12, nameArabic: "يوسف", nameTransliteration: "Yusuf", nameEnglish: "Joseph", revelationType: "Meccan", totalAyahs: 111 },
  { number: 13, nameArabic: "الرعد", nameTransliteration: "Ar-Ra'd", nameEnglish: "The Thunder", revelationType: "Medinan", totalAyahs: 43 },
  { number: 14, nameArabic: "ابراهيم", nameTransliteration: "Ibrahim", nameEnglish: "Abraham", revelationType: "Meccan", totalAyahs: 52 },
  { number: 15, nameArabic: "الحجر", nameTransliteration: "Al-Hijr", nameEnglish: "The Rocky Tract", revelationType: "Meccan", totalAyahs: 99 },
  { number: 16, nameArabic: "النحل", nameTransliteration: "An-Nahl", nameEnglish: "The Bee", revelationType: "Meccan", totalAyahs: 128 },
  { number: 17, nameArabic: "الإسراء", nameTransliteration: "Al-Isra", nameEnglish: "The Night Journey", revelationType: "Meccan", totalAyahs: 111 },
  { number: 18, nameArabic: "الكهف", nameTransliteration: "Al-Kahf", nameEnglish: "The Cave", revelationType: "Meccan", totalAyahs: 110 },
  { number: 19, nameArabic: "مريم", nameTransliteration: "Maryam", nameEnglish: "Mary", revelationType: "Meccan", totalAyahs: 98 },
  { number: 20, nameArabic: "طه", nameTransliteration: "Ta-Ha", nameEnglish: "Ta-Ha", revelationType: "Meccan", totalAyahs: 135 },
  { number: 21, nameArabic: "الأنبياء", nameTransliteration: "Al-Anbiya", nameEnglish: "The Prophets", revelationType: "Meccan", totalAyahs: 112 },
  { number: 22, nameArabic: "الحج", nameTransliteration: "Al-Hajj", nameEnglish: "The Pilgrimage", revelationType: "Medinan", totalAyahs: 78 },
  { number: 23, nameArabic: "المؤمنون", nameTransliteration: "Al-Mu'minun", nameEnglish: "The Believers", revelationType: "Meccan", totalAyahs: 118 },
  { number: 24, nameArabic: "النور", nameTransliteration: "An-Nur", nameEnglish: "The Light", revelationType: "Medinan", totalAyahs: 64 },
  { number: 25, nameArabic: "الفرقان", nameTransliteration: "Al-Furqan", nameEnglish: "The Criterian", revelationType: "Meccan", totalAyahs: 77 },
  { number: 26, nameArabic: "الشعراء", nameTransliteration: "Ash-Shu'ara", nameEnglish: "The Poets", revelationType: "Meccan", totalAyahs: 227 },
  { number: 27, nameArabic: "النمل", nameTransliteration: "An-Naml", nameEnglish: "The Ant", revelationType: "Meccan", totalAyahs: 93 },
  { number: 28, nameArabic: "القصص", nameTransliteration: "Al-Qasas", nameEnglish: "The Stories", revelationType: "Meccan", totalAyahs: 88 },
  { number: 29, nameArabic: "العنكبوت", nameTransliteration: "Al-'Ankabut", nameEnglish: "The Spider", revelationType: "Meccan", totalAyahs: 69 },
  { number: 30, nameArabic: "الروم", nameTransliteration: "Ar-Rum", nameEnglish: "The Romans", revelationType: "Meccan", totalAyahs: 60 },
  { number: 31, nameArabic: "لقمان", nameTransliteration: "Luqman", nameEnglish: "Luqman", revelationType: "Meccan", totalAyahs: 34 },
  { number: 32, nameArabic: "السجدة", nameTransliteration: "As-Sajdah", nameEnglish: "The Prostration", revelationType: "Meccan", totalAyahs: 30 },
  { number: 33, nameArabic: "الأحزاب", nameTransliteration: "Al-Ahzab", nameEnglish: "The Combined Forces", revelationType: "Medinan", totalAyahs: 73 },
  { number: 34, nameArabic: "سبإ", nameTransliteration: "Saba", nameEnglish: "Sheba", revelationType: "Meccan", totalAyahs: 54 },
  { number: 35, nameArabic: "فاطر", nameTransliteration: "Fatir", nameEnglish: "Originator", revelationType: "Meccan", totalAyahs: 45 },
  { number: 36, nameArabic: "يس", nameTransliteration: "Ya-Sin", nameEnglish: "Ya-Sin", revelationType: "Meccan", totalAyahs: 83 },
  { number: 37, nameArabic: "الصافات", nameTransliteration: "As-Saffat", nameEnglish: "Those who set the Ranks", revelationType: "Meccan", totalAyahs: 182 },
  { number: 38, nameArabic: "ص", nameTransliteration: "Sad", nameEnglish: "The Letter Sad", revelationType: "Meccan", totalAyahs: 88 },
  { number: 39, nameArabic: "الزمر", nameTransliteration: "Az-Zumar", nameEnglish: "The Troops", revelationType: "Meccan", totalAyahs: 75 },
  { number: 40, nameArabic: "غافر", nameTransliteration: "Ghafir", nameEnglish: "The Forgiver", revelationType: "Meccan", totalAyahs: 85 },
  { number: 41, nameArabic: "فصلت", nameTransliteration: "Fussilat", nameEnglish: "Explained in Detail", revelationType: "Meccan", totalAyahs: 54 },
  { number: 42, nameArabic: "الشورى", nameTransliteration: "Ash-Shura", nameEnglish: "The Consultation", revelationType: "Meccan", totalAyahs: 53 },
  { number: 43, nameArabic: "الزخرف", nameTransliteration: "Az-Zukhruf", nameEnglish: "The Ornaments of Gold", revelationType: "Meccan", totalAyahs: 89 },
  { number: 44, nameArabic: "الدخان", nameTransliteration: "Ad-Dukhan", nameEnglish: "The Smoke", revelationType: "Meccan", totalAyahs: 59 },
  { number: 45, nameArabic: "الجاثية", nameTransliteration: "Al-Jathiyah", nameEnglish: "The Crouching", revelationType: "Meccan", totalAyahs: 37 },
  { number: 46, nameArabic: "الأحقاف", nameTransliteration: "Al-Ahqaf", nameEnglish: "The Wind-Curved Sandhills", revelationType: "Meccan", totalAyahs: 35 },
  { number: 47, nameArabic: "محمد", nameTransliteration: "Muhammad", nameEnglish: "Muhammad", revelationType: "Medinan", totalAyahs: 38 },
  { number: 48, nameArabic: "الفتح", nameTransliteration: "Al-Fath", nameEnglish: "The Victory", revelationType: "Medinan", totalAyahs: 29 },
  { number: 49, nameArabic: "الحجرات", nameTransliteration: "Al-Hujurat", nameEnglish: "The Rooms", revelationType: "Medinan", totalAyahs: 18 },
  { number: 50, nameArabic: "ق", nameTransliteration: "Qaf", nameEnglish: "The Letter Qaf", revelationType: "Meccan", totalAyahs: 45 },
  { number: 51, nameArabic: "الذاريات", nameTransliteration: "Adh-Dhariyat", nameEnglish: "The Winnowing Winds", revelationType: "Meccan", totalAyahs: 60 },
  { number: 52, nameArabic: "الطور", nameTransliteration: "At-Tur", nameEnglish: "The Mount", revelationType: "Meccan", totalAyahs: 49 },
  { number: 53, nameArabic: "النجم", nameTransliteration: "An-Najm", nameEnglish: "The Star", revelationType: "Meccan", totalAyahs: 62 },
  { number: 54, nameArabic: "القمر", nameTransliteration: "Al-Qamar", nameEnglish: "The Moon", revelationType: "Meccan", totalAyahs: 55 },
  { number: 55, nameArabic: "الرحمن", nameTransliteration: "Ar-Rahman", nameEnglish: "The Beneficent", revelationType: "Medinan", totalAyahs: 78 },
  { number: 56, nameArabic: "الواقعة", nameTransliteration: "Al-Waqi'ah", nameEnglish: "The Inevitable", revelationType: "Meccan", totalAyahs: 96 },
  { number: 57, nameArabic: "الحديد", nameTransliteration: "Al-Hadid", nameEnglish: "The Iron", revelationType: "Medinan", totalAyahs: 29 },
  { number: 58, nameArabic: "المجادلة", nameTransliteration: "Al-Mujadila", nameEnglish: "The Pleading Woman", revelationType: "Medinan", totalAyahs: 22 },
  { number: 59, nameArabic: "الحشر", nameTransliteration: "Al-Hashr", nameEnglish: "The Exile", revelationType: "Medinan", totalAyahs: 24 },
  { number: 60, nameArabic: "الممتحنة", nameTransliteration: "Al-Mumtahanah", nameEnglish: "She that is to be examined", revelationType: "Medinan", totalAyahs: 13 },
  { number: 61, nameArabic: "الصف", nameTransliteration: "As-Saff", nameEnglish: "The Ranks", revelationType: "Medinan", totalAyahs: 14 },
  { number: 62, nameArabic: "الجمعة", nameTransliteration: "Al-Jumu'ah", nameEnglish: "Friday", revelationType: "Medinan", totalAyahs: 11 },
  { number: 63, nameArabic: "المنافقون", nameTransliteration: "Al-Munafiqun", nameEnglish: "The Hypocrites", revelationType: "Medinan", totalAyahs: 11 },
  { number: 64, nameArabic: "التغابن", nameTransliteration: "At-Taghabun", nameEnglish: "Mutual Disillusion", revelationType: "Medinan", totalAyahs: 18 },
  { number: 65, nameArabic: "الطلاق", nameTransliteration: "At-Talaq", nameEnglish: "The Divorce", revelationType: "Medinan", totalAyahs: 12 },
  { number: 66, nameArabic: "التحريم", nameTransliteration: "At-Tahrim", nameEnglish: "The Prohibition", revelationType: "Medinan", totalAyahs: 12 },
  { number: 67, nameArabic: "الملك", nameTransliteration: "Al-Mulk", nameEnglish: "The Sovereignty", revelationType: "Meccan", totalAyahs: 30 },
  { number: 68, nameArabic: "القلم", nameTransliteration: "Al-Qalam", nameEnglish: "The Pen", revelationType: "Meccan", totalAyahs: 52 },
  { number: 69, nameArabic: "الحاقة", nameTransliteration: "Al-Haqqah", nameEnglish: "The Inevitable Reality", revelationType: "Meccan", totalAyahs: 52 },
  { number: 70, nameArabic: "المعارج", nameTransliteration: "Al-Ma'arij", nameEnglish: "The Ascending Stairways", revelationType: "Meccan", totalAyahs: 44 },
  { number: 71, nameArabic: "نوح", nameTransliteration: "Nuh", nameEnglish: "Noah", revelationType: "Meccan", totalAyahs: 28 },
  { number: 72, nameArabic: "الجن", nameTransliteration: "Al-Jinn", nameEnglish: "The Jinn", revelationType: "Meccan", totalAyahs: 28 },
  { number: 73, nameArabic: "المزمل", nameTransliteration: "Al-Muzzammil", nameEnglish: "The Enshrouded One", revelationType: "Meccan", totalAyahs: 20 },
  { number: 74, nameArabic: "المدثر", nameTransliteration: "Al-Muddaththir", nameEnglish: "The Cloaked One", revelationType: "Meccan", totalAyahs: 56 },
  { number: 75, nameArabic: "القيامة", nameTransliteration: "Al-Qiyamah", nameEnglish: "The Resurrection", revelationType: "Meccan", totalAyahs: 40 },
  { number: 76, nameArabic: "الانسان", nameTransliteration: "Al-Insan", nameEnglish: "The Man", revelationType: "Medinan", totalAyahs: 31 },
  { number: 77, nameArabic: "المرسلات", nameTransliteration: "Al-Mursalat", nameEnglish: "The Emissaries", revelationType: "Meccan", totalAyahs: 50 },
  { number: 78, nameArabic: "النبإ", nameTransliteration: "An-Naba", nameEnglish: "The Tidings", revelationType: "Meccan", totalAyahs: 40 },
  { number: 79, nameArabic: "النازعات", nameTransliteration: "An-Nazi'at", nameEnglish: "Those who drag forth", revelationType: "Meccan", totalAyahs: 46 },
  { number: 80, nameArabic: "عبس", nameTransliteration: "'Abasa", nameEnglish: "He Frowned", revelationType: "Meccan", totalAyahs: 42 },
  { number: 81, nameArabic: "التکویر", nameTransliteration: "At-Takwir", nameEnglish: "The Overthrowing", revelationType: "Meccan", totalAyahs: 29 },
  { number: 82, nameArabic: "الانفطار", nameTransliteration: "Al-Infitar", nameEnglish: "The Cleaving", revelationType: "Meccan", totalAyahs: 19 },
  { number: 83, nameArabic: "المطففين", nameTransliteration: "Al-Mutaffifin", nameEnglish: "The Defrauding", revelationType: "Meccan", totalAyahs: 36 },
  { number: 84, nameArabic: "الانشقاق", nameTransliteration: "Al-Inshiqaq", nameEnglish: "The Splitting Open", revelationType: "Meccan", totalAyahs: 25 },
  { number: 85, nameArabic: "البروج", nameTransliteration: "Al-Buruj", nameEnglish: "The Mansions of the Stars", revelationType: "Meccan", totalAyahs: 22 },
  { number: 86, nameArabic: "الطارق", nameTransliteration: "At-Tariq", nameEnglish: "The Morning Star", revelationType: "Meccan", totalAyahs: 17 },
  { number: 87, nameArabic: "الأعلى", nameTransliteration: "Al-A'la", nameEnglish: "The Most High", revelationType: "Meccan", totalAyahs: 19 },
  { number: 88, nameArabic: "الغاشية", nameTransliteration: "Al-Ghashiyah", nameEnglish: "The Overwhelming", revelationType: "Meccan", totalAyahs: 26 },
  { number: 89, nameArabic: "الفجر", nameTransliteration: "Al-Fajr", nameEnglish: "The Dawn", revelationType: "Meccan", totalAyahs: 30 },
  { number: 90, nameArabic: "البلد", nameTransliteration: "Al-Balad", nameEnglish: "The City", revelationType: "Meccan", totalAyahs: 20 },
  { number: 91, nameArabic: "الشمس", nameTransliteration: "Ash-Shams", nameEnglish: "The Sun", revelationType: "Meccan", totalAyahs: 15 },
  { number: 92, nameArabic: "الليل", nameTransliteration: "Al-Layl", nameEnglish: "The Night", revelationType: "Meccan", totalAyahs: 21 },
  { number: 93, nameArabic: "الضحى", nameTransliteration: "Ad-Duha", nameEnglish: "The Morning Hours", revelationType: "Meccan", totalAyahs: 11 },
  { number: 94, nameArabic: "الشرح", nameTransliteration: "Ash-Sharh", nameEnglish: "The Relief", revelationType: "Meccan", totalAyahs: 8 },
  { number: 95, nameArabic: "التين", nameTransliteration: "At-Tin", nameEnglish: "The Fig", revelationType: "Meccan", totalAyahs: 8 },
  { number: 96, nameArabic: "العلق", nameTransliteration: "Al-'Alaq", nameEnglish: "The Clot", revelationType: "Meccan", totalAyahs: 19 },
  { number: 97, nameArabic: "القدر", nameTransliteration: "Al-Qadr", nameEnglish: "The Power", revelationType: "Meccan", totalAyahs: 5 },
  { number: 98, nameArabic: "البينة", nameTransliteration: "Al-Bayyinah", nameEnglish: "The Clear Proof", revelationType: "Medinan", totalAyahs: 8 },
  { number: 99, nameArabic: "الزلزلة", nameTransliteration: "Az-Zalzalah", nameEnglish: "The Earthquake", revelationType: "Medinan", totalAyahs: 8 },
  { number: 100, nameArabic: "العاديات", nameTransliteration: "Al-'Adiyat", nameEnglish: "The Courser", revelationType: "Meccan", totalAyahs: 11 },
  { number: 101, nameArabic: "القارعة", nameTransliteration: "Al-Qari'ah", nameEnglish: "The Calamity", revelationType: "Meccan", totalAyahs: 11 },
  { number: 102, nameArabic: "التکاثر", nameTransliteration: "At-Takathur", nameEnglish: "The Rivalry in world increase", revelationType: "Meccan", totalAyahs: 8 },
  { number: 103, nameArabic: "العصر", nameTransliteration: "Al-'Asr", nameEnglish: "The Declining Day", revelationType: "Meccan", totalAyahs: 3 },
  { number: 104, nameArabic: "الهمزة", nameTransliteration: "Al-Humazah", nameEnglish: "The Traducer", revelationType: "Meccan", totalAyahs: 9 },
  { number: 105, nameArabic: "الفيل", nameTransliteration: "Al-Fil", nameEnglish: "The Elephant", revelationType: "Meccan", totalAyahs: 5 },
  { number: 106, nameArabic: "قريش", nameTransliteration: "Quraysh", nameEnglish: "Quraysh", revelationType: "Meccan", totalAyahs: 4 },
  { number: 107, nameArabic: "الماعون", nameTransliteration: "Al-Ma'un", nameEnglish: "The Small Kindnesses", revelationType: "Meccan", totalAyahs: 7 },
  { number: 108, nameArabic: "الکوثر", nameTransliteration: "Al-Kawthar", nameEnglish: "The Abundance", revelationType: "Meccan", totalAyahs: 3 },
  { number: 109, nameArabic: "الکافرون", nameTransliteration: "Al-Kafirun", nameEnglish: "The Disbelievers", revelationType: "Meccan", totalAyahs: 6 },
  { number: 110, nameArabic: "النصر", nameTransliteration: "An-Nasr", nameEnglish: "The Divine Support", revelationType: "Medinan", totalAyahs: 3 },
  { number: 111, nameArabic: "المسد", nameTransliteration: "Al-Masad", nameEnglish: "The Palm Fiber", revelationType: "Meccan", totalAyahs: 5 },
  { number: 112, nameArabic: "الإخلاص", nameTransliteration: "Al-Ikhlas", nameEnglish: "The Sincerity", revelationType: "Meccan", totalAyahs: 4 },
  { number: 113, nameArabic: "الفلق", nameTransliteration: "Al-Falaq", nameEnglish: "The Daybreak", revelationType: "Meccan", totalAyahs: 5 },
  { number: 114, nameArabic: "الناس", nameTransliteration: "An-Nas", nameEnglish: "Mankind", revelationType: "Meccan", totalAyahs: 6 },
];

import { ALL_OFFLINE_SURAHS } from "./quran";

export const FALLBACK_SURAHS: Record<number, SurahData> = ALL_OFFLINE_SURAHS;

