import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface GlossaryTerm {
  id: number;
  term: string;
  arabic: string;
  transliteration: string;
  definition: string;
  usage?: string;
  quranRef?: string;
  category: "aqeedah" | "fiqh" | "quran" | "hadith" | "seerah" | "tasawwuf" | "arabic" | "general";
}

const CAT_CONFIG: Record<GlossaryTerm["category"], { label: string; color: string }> = {
  aqeedah: { label: "Aqeedah", color: "#7C3AED" },
  fiqh: { label: "Fiqh", color: "#16A34A" },
  quran: { label: "Quran", color: "#059669" },
  hadith: { label: "Hadith", color: "#D97706" },
  seerah: { label: "Seerah", color: "#0891B2" },
  tasawwuf: { label: "Spirituality", color: "#6366F1" },
  arabic: { label: "Arabic", color: "#DC2626" },
  general: { label: "General", color: "#78716C" },
};

const TERMS: GlossaryTerm[] = [
  // Aqeedah
  { id: 1, term: "Tawhid", arabic: "تَوْحِيد", transliteration: "Taw-HEED", definition: "The absolute oneness of Allah — the core doctrine of Islam. There is no deity worthy of worship except Allah, and He has no partners, equals, or offspring.", usage: "The fundamental principle upon which all of Islam is built. Shirk (associating partners with Allah) is the opposite of Tawhid.", quranRef: "Al-Ikhlas 112", category: "aqeedah" },
  { id: 2, term: "Shirk", arabic: "شِرْك", transliteration: "Shirk", definition: "Associating partners with Allah — the gravest sin in Islam. It is the only sin Allah has stated He will not forgive if a person dies upon it.", usage: "Major Shirk: worshipping idols, saints, or other deities. Minor Shirk: showing off (riya') in worship.", quranRef: "An-Nisa 4:48", category: "aqeedah" },
  { id: 3, term: "Iman", arabic: "إِيمَان", transliteration: "EE-man", definition: "Faith. Belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree (qadar) — both its good and bad.", usage: "Iman increases with obedience and decreases with sin, according to Ahlus-Sunnah.", category: "aqeedah" },
  { id: 4, term: "Kufr", arabic: "كُفْر", transliteration: "Kufr", definition: "Disbelief — covering the truth. Rejection of Allah, His messengers, or any established pillars of faith.", usage: "A person who commits Kufr is called a Kafir. The word comes from 'to cover' — as if covering the truth.", category: "aqeedah" },
  { id: 5, term: "Qadar", arabic: "قَدَر", transliteration: "Qa-DAR", definition: "Divine decree. Allah's eternal knowledge, writing, will, and creation of all that occurs. Everything happens by His permission and will.", usage: "Belief in Qadar is one of the 6 pillars of Iman. It has 4 levels: Knowledge, Writing (Lawh al-Mahfuz), Will, and Creation.", category: "aqeedah" },
  { id: 6, term: "Nifaq", arabic: "نِفَاق", transliteration: "Ni-FAQ", definition: "Hypocrisy — displaying Islam outwardly while concealing disbelief inwardly. The hypocrites (munafiqoon) are described in Surah Al-Baqarah and Al-Munafiqoon.", quranRef: "Al-Baqarah 2:8-20", category: "aqeedah" },
  { id: 7, term: "Tawakkul", arabic: "تَوَكُّل", transliteration: "Ta-WAK-kul", definition: "Complete trust and reliance upon Allah after taking the necessary means (asbab). Not to be confused with passivity — one takes action and relies on Allah for the outcome.", quranRef: "At-Talaq 65:3", category: "aqeedah" },
  { id: 8, term: "Barakah", arabic: "بَرَكَة", transliteration: "Ba-ra-kah", definition: "Divine blessing, increase, and goodness that Allah places in things, time, people, and places. More than just 'blessing' — it implies growth and abundance.", usage: "Barakah is placed in the early morning hours, in halal earning, in family ties, and in many other things according to the Sunnah.", category: "aqeedah" },

  // Fiqh
  { id: 9, term: "Fiqh", arabic: "فِقْه", transliteration: "Fiqh", definition: "Islamic jurisprudence — the human understanding and application of Sharia derived from the Quran, Sunnah, consensus (Ijma'), and analogical reasoning (Qiyas).", usage: "The four major Sunni schools of Fiqh: Hanafi, Maliki, Shafi'i, Hanbali.", category: "fiqh" },
  { id: 10, term: "Halal", arabic: "حَلَال", transliteration: "Ha-LAL", definition: "Permissible — what Allah has allowed. Applies to food, drink, actions, earnings, and all matters of life.", category: "fiqh" },
  { id: 11, term: "Haram", arabic: "حَرَام", transliteration: "Ha-RAM", definition: "Forbidden — what Allah has prohibited. Engaging in the Haram is a sin that requires repentance.", category: "fiqh" },
  { id: 12, term: "Makruh", arabic: "مَكْرُوه", transliteration: "Mak-ROOH", definition: "Disliked/reprehensible — actions that are discouraged but not sinful if done. Rewarded when avoided, not punished when done.", category: "fiqh" },
  { id: 13, term: "Mustahabb", arabic: "مُسْتَحَبّ", transliteration: "Mus-ta-HABB", definition: "Recommended/preferable — actions that are encouraged and rewarded but not obligatory. Also called Nafl or Sunnah Muakkadah.", category: "fiqh" },
  { id: 14, term: "Fard", arabic: "فَرْض", transliteration: "Fard", definition: "Obligatory — actions that are required by Islamic law. Leaving them without excuse is sinful. E.g., the 5 daily prayers, Zakat, Hajj (once in a lifetime).", category: "fiqh" },
  { id: 15, term: "Wajib", arabic: "وَاجِب", transliteration: "WAA-jib", definition: "In Hanafi fiqh, a level below Fard — obligatory based on strong but not definitive evidence. In other madhabs, Wajib and Fard are synonymous.", category: "fiqh" },
  { id: 16, term: "Ijma", arabic: "إِجْمَاع", transliteration: "Ij-MAA'", definition: "Scholarly consensus — agreement of qualified Islamic scholars of a particular era on a ruling. One of the four sources of Islamic law.", category: "fiqh" },
  { id: 17, term: "Qiyas", arabic: "قِيَاس", transliteration: "Qi-YAS", definition: "Analogical reasoning — deriving rulings for new matters by analogy with established Quranic or Sunnah rulings based on shared characteristics.", category: "fiqh" },
  { id: 18, term: "Ijtihad", arabic: "اجْتِهَاد", transliteration: "Ij-ti-HAD", definition: "Independent juristic reasoning — the effort of a qualified scholar to derive a ruling on a new issue from the sources of Islamic law.", category: "fiqh" },
  { id: 19, term: "Fatwa", arabic: "فَتْوَى", transliteration: "FAT-wa", definition: "A formal Islamic legal opinion issued by a qualified scholar (Mufti) on a specific question or matter.", category: "fiqh" },
  { id: 20, term: "Mufti", arabic: "مُفْتِي", transliteration: "MUF-tee", definition: "A qualified Islamic scholar authorized to issue fatwas (legal opinions). Requires mastery of Quran, Hadith, Arabic, Fiqh, and Usul al-Fiqh.", category: "fiqh" },

  // Quran
  { id: 21, term: "Ayah", arabic: "آيَة", transliteration: "AA-ya", definition: "A verse of the Quran. Literally means 'sign' — every verse of the Quran is a divine sign. The Quran contains 6,236 ayahs.", category: "quran" },
  { id: 22, term: "Surah", arabic: "سُورَة", transliteration: "SOO-ra", definition: "A chapter of the Quran. There are 114 Surahs, each with a name and a specific theme. They range from 3 to 286 ayahs.", category: "quran" },
  { id: 23, term: "Juz", arabic: "جُزء", transliteration: "Juz", definition: "One of 30 equal divisions of the Quran, used to facilitate recitation over one month (e.g., one Juz per day during Ramadan).", category: "quran" },
  { id: 24, term: "Tajweed", arabic: "تَجْوِيد", transliteration: "Taj-WEED", definition: "The rules of correct Quran recitation — including pronunciation, rhythm, and proper articulation of each letter. Derived from the root meaning 'to make beautiful.'", category: "quran" },
  { id: 25, term: "Hafiz", arabic: "حَافِظ", transliteration: "HAA-fiz", definition: "One who has memorized the entire Quran (all 6,236 verses, 114 surahs). Literally means 'one who preserves/guards.' Female: Hafizah.", category: "quran" },
  { id: 26, term: "Tafsir", arabic: "تَفْسِير", transliteration: "Taf-SEER", definition: "Exegesis/commentary of the Quran. Scholarly explanation of the meaning, context (Asbab al-Nuzul), and implications of Quranic verses.", usage: "Famous Tafasir: Ibn Kathir, Al-Tabari, Al-Qurtubi, Al-Jalalayn, Fi Zilalil Quran (Sayyid Qutb).", category: "quran" },
  { id: 27, term: "Makki & Madani", arabic: "مَكِّيّ وَمَدَنِيّ", transliteration: "MAK-kee wa MA-da-nee", definition: "Classification of Quranic surahs. Makki surahs were revealed before Hijrah (focus on Tawhid, akhirah). Madani surahs were revealed after Hijrah (focus on laws, social order, munafiqoon).", category: "quran" },
  { id: 28, term: "Asbab al-Nuzul", arabic: "أَسْبَاب النُّزُول", transliteration: "As-BAB an-Nu-ZOOL", definition: "Occasions/reasons of revelation — the historical context behind the revelation of specific Quranic verses. Understanding this is crucial for correct Tafsir.", category: "quran" },

  // Hadith
  { id: 29, term: "Hadith", arabic: "حَدِيث", transliteration: "Ha-DEETH", definition: "The recorded sayings, actions, approvals, and descriptions of the Prophet Muhammad ﷺ. The second source of Islamic law after the Quran.", category: "hadith" },
  { id: 30, term: "Sahih", arabic: "صَحِيح", transliteration: "Sa-HEEH", definition: "Authentic — the highest grade of hadith authenticity. Requires an unbroken chain of trustworthy narrators, no contradictions with stronger evidence.", usage: "Sahih Bukhari and Sahih Muslim are the most authenticated hadith collections.", category: "hadith" },
  { id: 31, term: "Hasan", arabic: "حَسَن", transliteration: "HA-san", definition: "Good — a hadith that meets most authenticity criteria but has a slight weakness in memory or continuity of the chain, yet is still acceptable as evidence.", category: "hadith" },
  { id: 32, term: "Da'if", arabic: "ضَعِيف", transliteration: "Da-EEFF", definition: "Weak — a hadith with deficiencies in the chain of narrators or text. Cannot be used for deriving rulings but may be cited for encouragement in some scholars' opinions.", category: "hadith" },
  { id: 33, term: "Mawdu", arabic: "مَوْضُوع", transliteration: "Maw-DOO'", definition: "Fabricated — a hadith that has been invented and falsely attributed to the Prophet ﷺ. Using fabricated hadiths is forbidden.", category: "hadith" },
  { id: 34, term: "Isnad", arabic: "إِسْنَاد", transliteration: "Is-NAD", definition: "The chain of narrators through which a hadith is transmitted — e.g., A told B, who told C, who heard it from the Prophet ﷺ. Unique feature of Islamic scholarship.", category: "hadith" },
  { id: 35, term: "Mutawatir", arabic: "مُتَوَاتِر", transliteration: "Mu-ta-WA-tir", definition: "Mass-transmitted — a hadith narrated by so many people at each level that fabrication is impossible. The Quran itself is Mutawatir in transmission.", category: "hadith" },
  { id: 36, term: "Sunnah", arabic: "سُنَّة", transliteration: "SUN-na", definition: "The way/practice of the Prophet ﷺ — his sayings, actions, and tacit approvals. The second source of Islamic guidance after the Quran.", category: "hadith" },

  // Seerah
  { id: 37, term: "Sahabah", arabic: "صَحَابَة", transliteration: "Sa-HAA-ba", definition: "The Companions — those who saw the Prophet ﷺ, believed in him, and died as Muslims. They are considered the best generation after the prophets.", category: "seerah" },
  { id: 38, term: "Tabi'in", arabic: "تَابِعِين", transliteration: "Ta-bi-EEN", definition: "The Successors — the generation after the Companions who met the Sahabah and learned from them directly.", category: "seerah" },
  { id: 39, term: "Hijrah", arabic: "هِجْرَة", transliteration: "HIJ-ra", definition: "Migration — specifically the Prophet's ﷺ emigration from Makkah to Madinah in 622 CE. The Islamic calendar (AH) begins with this event.", category: "seerah" },
  { id: 40, term: "Khilafah", arabic: "خِلَافَة", transliteration: "Khi-LA-fa", definition: "Caliphate — the Islamic system of leadership after the Prophet ﷺ. The first four caliphs (Abu Bakr, Umar, Uthman, Ali) are called the Rightly Guided Caliphs (Khulafa' Rashidun).", category: "seerah" },
  { id: 41, term: "Bai'ah", arabic: "بَيْعَة", transliteration: "BAY-ah", definition: "Pledge of allegiance — a formal oath of loyalty to a leader. The companions gave Bai'ah to the Prophet ﷺ and later to the Caliphs.", category: "seerah" },

  // Spirituality / Tasawwuf
  { id: 42, term: "Tawbah", arabic: "تَوْبَة", transliteration: "TAW-ba", definition: "Repentance — turning back to Allah after sin. Conditions: stop the sin, feel remorse, resolve not to return, and restore others' rights if violated.", quranRef: "At-Tahrim 66:8", category: "tasawwuf" },
  { id: 43, term: "Taqwa", arabic: "تَقْوَى", transliteration: "TAQ-wa", definition: "God-consciousness, piety, fear of Allah. Being aware of Allah's presence and choosing actions accordingly — avoiding what He forbids and fulfilling what He commands.", quranRef: "Al-Baqarah 2:2", category: "tasawwuf" },
  { id: 44, term: "Khushu", arabic: "خُشُوع", transliteration: "Khu-SHOO'", definition: "Humility, reverence, and focus — especially in Salah. The presence of the heart before Allah in prayer.", quranRef: "Al-Mu'minoon 23:2", category: "tasawwuf" },
  { id: 45, term: "Ikhlas", arabic: "إِخْلَاص", transliteration: "Ikh-LAS", definition: "Sincerity — doing all acts of worship purely for Allah's sake alone, without any desire for recognition, praise, or worldly gain.", quranRef: "Al-Bayyinah 98:5", category: "tasawwuf" },
  { id: 46, term: "Sabr", arabic: "صَبْر", transliteration: "Sabr", definition: "Patience — of 3 types: patience in obeying Allah, patience in refraining from disobedience, and patience during trials. One of the highest virtues in Islam.", quranRef: "Az-Zumar 39:10", category: "tasawwuf" },
  { id: 47, term: "Shukr", arabic: "شُكْر", transliteration: "Shukr", definition: "Gratitude — recognizing Allah's blessings and expressing thanks through the heart, tongue, and actions. The opposite of Kufr (covering/ingratitude).", quranRef: "Ibrahim 14:7", category: "tasawwuf" },
  { id: 48, term: "Zuhd", arabic: "زُهْد", transliteration: "Zuhd", definition: "Asceticism/detachment from the dunya (worldly life) — not because the world is evil, but because one prioritizes the akhirah. Not necessarily poverty.", category: "tasawwuf" },
  { id: 49, term: "Dhikr", arabic: "ذِكْر", transliteration: "Dhikr", definition: "Remembrance of Allah — through tasbih, tahmid, takbir, Quran recitation, dua, and any form of worship performed mindfully.", quranRef: "Al-Baqarah 2:152", category: "tasawwuf" },
  { id: 50, term: "Ihsan", arabic: "إِحْسَان", transliteration: "Ih-SAN", definition: "Excellence in worship — the Prophet ﷺ defined it as: 'To worship Allah as if you see Him, and if you cannot see Him, He surely sees you.' The highest level of faith.", category: "tasawwuf" },

  // Arabic terms
  { id: 51, term: "Inshallah", arabic: "إِن شَاءَ اللَّه", transliteration: "In-sha-Al-LAH", definition: "If Allah wills — expressing that all future events depend on Allah's will. A required expression when speaking of future plans.", quranRef: "Al-Kahf 18:23-24", category: "arabic" },
  { id: 52, term: "Alhamdulillah", arabic: "الْحَمْدُ لِلَّه", transliteration: "Al-HAM-du-lil-LAH", definition: "All praise is due to Allah — expressing gratitude and praise. Opening words of Al-Fatihah.", category: "arabic" },
  { id: 53, term: "Allahu Akbar", arabic: "اللَّهُ أَكْبَر", transliteration: "Al-LA-hu AK-bar", definition: "Allah is the Greatest — said at the start of prayer (Takbiratul Ihram), in Adhan, and as a general expression of glorification.", category: "arabic" },
  { id: 54, term: "Subhanallah", arabic: "سُبْحَانَ اللَّه", transliteration: "Sub-HA-nal-LAH", definition: "Glory be to Allah — exalting Allah above any imperfection or deficiency. Especially for moments of amazement or to exalt Allah.", category: "arabic" },
  { id: 55, term: "Astaghfirullah", arabic: "أَسْتَغْفِرُ اللَّه", transliteration: "As-tagh-fi-RUL-lah", definition: "I seek forgiveness from Allah — a phrase of seeking forgiveness. Should be said frequently, especially after prayer and in the morning/evening.", category: "arabic" },
  { id: 56, term: "Bismillah", arabic: "بِسْمِ اللَّه", transliteration: "Bis-mil-LAH", definition: "In the name of Allah — said before beginning any permissible action. Full form: Bismillahir Rahmanir Raheem.", category: "arabic" },
  { id: 57, term: "Jazakallahu Khayran", arabic: "جَزَاكَ اللَّهُ خَيْرًا", transliteration: "Ja-za-KAL-lahu KHAY-ran", definition: "May Allah reward you with good — the Islamic way of saying 'thank you,' invoking Allah's reward for the person.", category: "arabic" },
  { id: 58, term: "Inna lillahi", arabic: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُون", transliteration: "In-na lil-LA-hi wa-in-na i-LAY-hi RA-ji-'oon", definition: "Indeed we belong to Allah, and indeed to Him we shall return — said upon hearing of someone's death or a calamity.", quranRef: "Al-Baqarah 2:156", category: "arabic" },

  // General
  { id: 59, term: "Ummah", arabic: "أُمَّة", transliteration: "UM-ma", definition: "The Muslim community worldwide — all believers who follow the Prophet Muhammad ﷺ, regardless of nationality or ethnicity.", category: "general" },
  { id: 60, term: "Dawah", arabic: "دَعْوَة", transliteration: "DAW-ah", definition: "Invitation to Islam — calling others to the faith through speech, action, or example. An obligation on every Muslim according to their ability.", category: "general" },
  { id: 61, term: "Akhirah", arabic: "آخِرَة", transliteration: "AA-khi-ra", definition: "The Hereafter — eternal life after death: the Day of Judgment, Paradise (Jannah), and Hellfire (Jahannam). Belief in the Akhirah is one of the 6 pillars of Iman.", category: "general" },
  { id: 62, term: "Dunya", arabic: "دُنْيَا", transliteration: "DUN-ya", definition: "The worldly life — this temporary existence. From the root meaning 'low' or 'near' — it is the lowest and nearest of the two lives. Islam encourages balance between dunya and akhirah.", category: "general" },
  { id: 63, term: "Fitnah", arabic: "فِتْنَة", transliteration: "FIT-na", definition: "Trial, tribulation, temptation, or civil strife. Can refer to personal tests or larger societal conflicts/disorder.", quranRef: "Al-Baqarah 2:191", category: "general" },
  { id: 64, term: "Rizq", arabic: "رِزْق", transliteration: "Rizq", definition: "Provision — everything Allah provides: food, wealth, children, knowledge, health. Rizq is predestined and guaranteed by Allah for every living creature.", category: "general" },
  { id: 65, term: "Hikmah", arabic: "حِكْمَة", transliteration: "HIK-ma", definition: "Wisdom — deep understanding combined with proper action. A gift from Allah to those He wills.", quranRef: "Al-Baqarah 2:269", category: "general" },
  { id: 66, term: "Niyyah", arabic: "نِيَّة", transliteration: "NIY-ya", definition: "Intention — the purpose behind an action. The Prophet ﷺ said: 'Actions are by intentions, and every person will have what they intended.' (Bukhari/Muslim)", category: "general" },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function GlossaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<GlossaryTerm["category"] | "all">("all");
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TERMS.filter(t => {
      const matchCat = catFilter === "all" || t.category === catFilter;
      const matchSearch = !q || t.term.toLowerCase().includes(q) || t.arabic.includes(q) || t.definition.toLowerCase().includes(q);
      return matchCat && matchSearch;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [search, catFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    filtered.forEach(t => {
      const letter = t.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(t);
    });
    return groups;
  }, [filtered]);

  const s = makeStyles(colors);

  if (selectedTerm) {
    const catCfg = CAT_CONFIG[selectedTerm.category];
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedTerm(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>{selectedTerm.term}</Text>
          </View>
          <View style={[s.catBadge, { backgroundColor: catCfg.color + "20" }]}>
            <Text style={[s.catBadgeText, { color: catCfg.color }]}>{catCfg.label}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[s.termHero, { backgroundColor: colors.navy }]}>
            <Text style={s.termHeroAr}>{selectedTerm.arabic}</Text>
            <Text style={s.termHeroEn}>{selectedTerm.term}</Text>
            <Text style={[s.termTranslit, { color: colors.gold }]}>/{selectedTerm.transliteration}/</Text>
          </View>
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>DEFINITION</Text>
          <View style={[s.defCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.defText, { color: colors.foreground }]}>{selectedTerm.definition}</Text>
          </View>
          {selectedTerm.usage && (
            <>
              <Text style={[s.secLabel, { color: colors.mutedForeground }]}>USAGE & NOTES</Text>
              <View style={[s.usageCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[s.usageText, { color: colors.foreground }]}>{selectedTerm.usage}</Text>
              </View>
            </>
          )}
          {selectedTerm.quranRef && (
            <View style={[s.quranRefCard, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "40" }]}>
              <Feather name="book-open" size={14} color={colors.gold} />
              <Text style={[s.quranRefText, { color: colors.foreground }]}>Quranic reference: <Text style={[{ color: colors.gold, fontFamily: "Inter_600SemiBold" }]}>{selectedTerm.quranRef}</Text></Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Islamic Glossary</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>قَامُوس إِسْلَامِي</Text>
        </View>
        <View style={[s.countBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[s.countText, { color: colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput style={[s.searchInput, { color: colors.foreground }]} placeholder="Search terms, Arabic, definitions…" placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catScrollContent}>
        <TouchableOpacity style={[s.catChip, { backgroundColor: catFilter === "all" ? colors.primary : colors.card, borderColor: catFilter === "all" ? colors.primary : colors.border }]} onPress={() => setCatFilter("all")}>
          <Text style={[s.catChipText, { color: catFilter === "all" ? "#FFF" : colors.mutedForeground }]}>All</Text>
        </TouchableOpacity>
        {(Object.entries(CAT_CONFIG) as [GlossaryTerm["category"], typeof CAT_CONFIG[GlossaryTerm["category"]]][]).map(([key, cfg]) => (
          <TouchableOpacity key={key} style={[s.catChip, { backgroundColor: catFilter === key ? cfg.color : colors.card, borderColor: catFilter === key ? cfg.color : colors.border }]} onPress={() => setCatFilter(key)}>
            <Text style={[s.catChipText, { color: catFilter === key ? "#FFF" : colors.mutedForeground }]}>{cfg.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}>
        {Object.entries(grouped).map(([letter, terms]) => (
          <View key={letter}>
            <View style={[s.letterHeader, { backgroundColor: colors.border + "50" }]}>
              <Text style={[s.letterHeaderText, { color: colors.mutedForeground }]}>{letter}</Text>
            </View>
            {terms.map(term => {
              const catCfg = CAT_CONFIG[term.category];
              return (
                <TouchableOpacity key={term.id} style={[s.termRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelectedTerm(term)} activeOpacity={0.8}>
                  <View style={[s.termLeft, { backgroundColor: catCfg.color + "15" }]}>
                    <Text style={[s.termAr, { color: catCfg.color }]}>{term.arabic}</Text>
                  </View>
                  <View style={s.termBody}>
                    <View style={s.termTop}>
                      <Text style={[s.termName, { color: colors.foreground }]}>{term.term}</Text>
                      <View style={[s.termCat, { backgroundColor: catCfg.color + "12" }]}>
                        <Text style={[s.termCatText, { color: catCfg.color }]}>{catCfg.label}</Text>
                      </View>
                    </View>
                    <Text style={[s.termTranslitSmall, { color: colors.primary }]}>/{term.transliteration}/</Text>
                    <Text style={[s.termDefPreview, { color: colors.mutedForeground }]} numberOfLines={1}>{term.definition}</Text>
                  </View>
                  <Feather name="chevron-right" size={14} color={colors.border} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 12 },
    countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    countText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    catBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, gap: 8, marginBottom: 4 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

    catScroll: { maxHeight: 44 },
    catScrollContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: "center" },
    catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    catChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    listContent: { paddingHorizontal: 16, paddingTop: 8 },
    letterHeader: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: 6, marginTop: 4, alignSelf: "flex-start" },
    letterHeaderText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    termRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
    termLeft: { width: 50, height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    termAr: { fontSize: 18 },
    termBody: { flex: 1 },
    termTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
    termName: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
    termCat: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
    termCatText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
    termTranslitSmall: { fontSize: 10, fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 2 },
    termDefPreview: { fontSize: 11, fontFamily: "Inter_400Regular" },

    // Detail
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },
    termHero: { borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 16 },
    termHeroAr: { fontSize: 42, color: "#FFF", lineHeight: 60, marginBottom: 4 },
    termHeroEn: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 6 },
    termTranslit: { fontSize: 14, fontFamily: "Inter_400Regular", fontStyle: "italic" },
    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 6 },
    defCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
    defText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 24 },
    usageCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    usageText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    quranRefCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
    quranRefText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  });
}
