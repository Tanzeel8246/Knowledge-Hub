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

interface IslamicName {
  id: number;
  name: string;
  arabic: string;
  gender: "male" | "female" | "both";
  meaning: string;
  origin: string;
  notes?: string;
  quranRef?: string;
  category: "prophetic" | "quranic" | "classical" | "nature" | "virtue";
}

const NAMES: IslamicName[] = [
  // Male Names
  { id: 1, name: "Ahmad", arabic: "أَحْمَد", gender: "male", meaning: "Most praiseworthy, most commendable", origin: "Arabic", notes: "One of the Prophet Muhammad's ﷺ names mentioned in the Quran.", quranRef: "As-Saff 61:6", category: "prophetic" },
  { id: 2, name: "Muhammad", arabic: "مُحَمَّد", gender: "male", meaning: "Praised, praiseworthy", origin: "Arabic", notes: "The name of the final Prophet ﷺ. Mentioned 4 times in the Quran.", quranRef: "Ali Imran 3:144", category: "prophetic" },
  { id: 3, name: "Ibrahim", arabic: "إِبْرَاهِيم", gender: "male", meaning: "Father of many nations", origin: "Semitic/Arabic", notes: "The name of Prophet Ibrahim (AS), friend of Allah.", category: "prophetic" },
  { id: 4, name: "Yusuf", arabic: "يُوسُف", gender: "male", meaning: "Allah increases, He adds", origin: "Hebrew/Arabic", notes: "Prophet Yusuf (AS) — his story is called 'the best of stories' in the Quran.", quranRef: "Surah Yusuf 12:3", category: "prophetic" },
  { id: 5, name: "Musa", arabic: "مُوسَى", gender: "male", meaning: "Drawn from the water", origin: "Egyptian/Arabic", notes: "The most mentioned prophet in the Quran.", category: "prophetic" },
  { id: 6, name: "Isa", arabic: "عِيسَى", gender: "male", meaning: "Allah saves", origin: "Aramaic/Arabic", notes: "Prophet Isa (AS), son of Maryam.", category: "prophetic" },
  { id: 7, name: "Yahya", arabic: "يَحْيَى", gender: "male", meaning: "He lives, the living one", origin: "Arabic", notes: "Allah named him Yahya — the first to bear this name. Quran: 'We have not given this name to anyone before.'", quranRef: "Maryam 19:7", category: "prophetic" },
  { id: 8, name: "Dawud", arabic: "دَاوُود", gender: "male", meaning: "Beloved, beloved one", origin: "Hebrew/Arabic", notes: "Prophet and king Dawud (AS).", category: "prophetic" },
  { id: 9, name: "Sulayman", arabic: "سُلَيْمَان", gender: "male", meaning: "Man of peace", origin: "Hebrew/Arabic", category: "prophetic" },
  { id: 10, name: "Adam", arabic: "آدَم", gender: "male", meaning: "Man, earth, clay", origin: "Arabic/Semitic", notes: "First prophet and father of all humanity.", category: "prophetic" },
  { id: 11, name: "Nuh", arabic: "نُوح", gender: "male", meaning: "Rest, comfort", origin: "Semitic/Arabic", category: "prophetic" },
  { id: 12, name: "Zakariyya", arabic: "زَكَرِيَّا", gender: "male", meaning: "Remembered by Allah", origin: "Hebrew/Arabic", category: "prophetic" },
  { id: 13, name: "Idris", arabic: "إِدْرِيس", gender: "male", meaning: "Studious, one who learns", origin: "Arabic", category: "prophetic" },
  { id: 14, name: "Hud", arabic: "هُود", gender: "male", meaning: "He who guides", origin: "Arabic", category: "prophetic" },
  { id: 15, name: "Salih", arabic: "صَالِح", gender: "male", meaning: "Righteous, pious", origin: "Arabic", category: "virtue" },
  { id: 16, name: "Abdullah", arabic: "عَبْدُ اللَّه", gender: "male", meaning: "Servant of Allah", origin: "Arabic", notes: "The most beloved names to Allah are Abdullah and Abdur-Rahman (Hadith).", category: "quranic" },
  { id: 17, name: "Abdur-Rahman", arabic: "عَبْدُ الرَّحْمَن", gender: "male", meaning: "Servant of the Most Merciful", origin: "Arabic", notes: "Mentioned in the Quran: 'Servants of the Most Merciful...'", quranRef: "Al-Furqan 25:63", category: "quranic" },
  { id: 18, name: "Ali", arabic: "عَلِيّ", gender: "male", meaning: "High, exalted, elevated", origin: "Arabic", notes: "Also a name/attribute of Allah (Al-Ali).", category: "quranic" },
  { id: 19, name: "Hasan", arabic: "حَسَن", gender: "male", meaning: "Beautiful, good, handsome", origin: "Arabic", notes: "Grandson of the Prophet ﷺ, son of Ali RA and Fatimah RA.", category: "classical" },
  { id: 20, name: "Husayn", arabic: "حُسَيْن", gender: "male", meaning: "Good, beautiful (diminutive of Hasan)", origin: "Arabic", notes: "Grandson of the Prophet ﷺ, martyred at Karbala.", category: "classical" },
  { id: 21, name: "Umar", arabic: "عُمَر", gender: "male", meaning: "Life, flourishing", origin: "Arabic", notes: "Second Caliph, Umar ibn al-Khattab (RA).", category: "classical" },
  { id: 22, name: "Uthman", arabic: "عُثْمَان", gender: "male", meaning: "Powerful like a snake, wise", origin: "Arabic", notes: "Third Caliph, Uthman ibn Affan (RA).", category: "classical" },
  { id: 23, name: "Bilal", arabic: "بِلَال", gender: "male", meaning: "Refreshing, moist (as water)", origin: "Arabic", notes: "Bilal ibn Rabah (RA) — first muezzin in Islam.", category: "classical" },
  { id: 24, name: "Khalid", arabic: "خَالِد", gender: "male", meaning: "Immortal, eternal", origin: "Arabic", notes: "Khalid ibn Walid (RA) — undefeated military commander.", category: "classical" },
  { id: 25, name: "Hamza", arabic: "حَمْزَة", gender: "male", meaning: "Steadfast, strong", origin: "Arabic", notes: "Hamza ibn Abdul Muttalib (RA) — uncle of the Prophet ﷺ, Lion of Allah.", category: "classical" },
  { id: 26, name: "Tariq", arabic: "طَارِق", gender: "male", meaning: "Morning star, night visitor", origin: "Arabic", quranRef: "At-Tariq 86:1-3", category: "quranic" },
  { id: 27, name: "Nabil", arabic: "نَبِيل", gender: "male", meaning: "Noble, excellent", origin: "Arabic", category: "virtue" },
  { id: 28, name: "Amir", arabic: "أَمِير", gender: "male", meaning: "Prince, commander", origin: "Arabic", category: "virtue" },
  { id: 29, name: "Zaid", arabic: "زَيْد", gender: "male", meaning: "Growth, increase", origin: "Arabic", notes: "Zayd ibn Harithah (RA) — beloved adopted son of the Prophet ﷺ. Only companion named in the Quran.", quranRef: "Al-Ahzab 33:37", category: "quranic" },
  { id: 30, name: "Salman", arabic: "سَلْمَان", gender: "male", meaning: "Peaceful, safe", origin: "Arabic", notes: "Salman al-Farisi (RA) — companion who suggested the strategy of the trench.", category: "classical" },
  { id: 31, name: "Jabir", arabic: "جَابِر", gender: "male", meaning: "One who sets bones, comforter", origin: "Arabic", category: "virtue" },
  { id: 32, name: "Faris", arabic: "فَارِس", gender: "male", meaning: "Knight, horseman, skilled rider", origin: "Arabic", category: "virtue" },
  { id: 33, name: "Rayyan", arabic: "رَيَّان", gender: "male", meaning: "Lush, full of drink", origin: "Arabic", notes: "Rayyan is a gate of Jannah for those who fast. (Hadith - Bukhari)", category: "quranic" },
  { id: 34, name: "Sufyan", arabic: "سُفْيَان", gender: "male", meaning: "Light wind, swift", origin: "Arabic", category: "classical" },
  { id: 35, name: "Luqman", arabic: "لُقْمَان", gender: "male", meaning: "Wise, one who swallows", origin: "Semitic/Arabic", notes: "A wise man mentioned in the Quran in Surah Luqman.", quranRef: "Surah Luqman 31:12", category: "quranic" },
  { id: 36, name: "Anas", arabic: "أَنَس", gender: "male", meaning: "Friendliness, harmony", origin: "Arabic", notes: "Anas ibn Malik (RA) — servant and companion of the Prophet ﷺ for 10 years.", category: "classical" },
  { id: 37, name: "Imran", arabic: "عِمْرَان", gender: "male", meaning: "Prosperity, civilization", origin: "Arabic/Hebrew", notes: "Father of Maryam (AS). A surah (Ali Imran) is named after his family.", category: "quranic" },

  // Female Names
  { id: 38, name: "Maryam", arabic: "مَرْيَم", gender: "female", meaning: "Devout worshipper, beloved", origin: "Aramaic/Arabic", notes: "The mother of Prophet Isa (AS). The only woman mentioned by name in the Quran. Surah Maryam is named after her.", quranRef: "Surah Maryam 19:16", category: "quranic" },
  { id: 39, name: "Fatimah", arabic: "فَاطِمَة", gender: "female", meaning: "One who weans, abstains from evil", origin: "Arabic", notes: "Daughter of the Prophet ﷺ, wife of Ali RA, mother of Hasan and Husayn.", category: "prophetic" },
  { id: 40, name: "Khadijah", arabic: "خَدِيجَة", gender: "female", meaning: "Born prematurely, trustworthy", origin: "Arabic", notes: "First wife of the Prophet ﷺ and first Muslim. The Prophet ﷺ loved her deeply all his life.", category: "classical" },
  { id: 41, name: "Aisha", arabic: "عَائِشَة", gender: "female", meaning: "Living, she who lives", origin: "Arabic", notes: "Wife of the Prophet ﷺ, beloved Umm al-Mu'minin, great scholar of Islam.", category: "classical" },
  { id: 42, name: "Hajar", arabic: "هَاجَر", gender: "female", meaning: "Migration, emigrant", origin: "Egyptian/Arabic", notes: "Wife of Ibrahim (AS), mother of Ismail (AS). Her running between Safa and Marwa is commemorated in Hajj.", category: "prophetic" },
  { id: 43, name: "Sara", arabic: "سَارَة", gender: "female", meaning: "Noble woman, princess", origin: "Hebrew/Arabic", notes: "Wife of Ibrahim (AS), mother of Ishaq (AS). Angels announced her son's birth.", category: "prophetic" },
  { id: 44, name: "Asiyah", arabic: "آسِيَة", gender: "female", meaning: "One who heals, one who consoles", origin: "Arabic", notes: "Wife of Pharaoh who rescued infant Musa (AS). Among the 4 greatest women in all of history (Hadith).", category: "classical" },
  { id: 45, name: "Sumayyah", arabic: "سُمَيَّة", gender: "female", meaning: "High, exalted", origin: "Arabic", notes: "First martyr in Islam — a female slave tortured for her faith.", category: "classical" },
  { id: 46, name: "Zaynab", arabic: "زَيْنَب", gender: "female", meaning: "Fragrant flower, father's jewel", origin: "Arabic", notes: "Daughter of the Prophet ﷺ. Also name of a companion. A surah is named Al-Ahzab which mentions her.", category: "prophetic" },
  { id: 47, name: "Ruqayyah", arabic: "رُقَيَّة", gender: "female", meaning: "Ascending, charm, incantation", origin: "Arabic", notes: "Daughter of the Prophet ﷺ.", category: "prophetic" },
  { id: 48, name: "Umm Kulthum", arabic: "أُمّ كُلْثُوم", gender: "female", meaning: "Mother of Kulthum (chubby-cheeked)", origin: "Arabic", notes: "Daughter of the Prophet ﷺ. Married Uthman (RA) after Ruqayyah's death.", category: "prophetic" },
  { id: 49, name: "Hafsa", arabic: "حَفْصَة", gender: "female", meaning: "Cub of a lion, young she-lion", origin: "Arabic", notes: "Wife of the Prophet ﷺ, daughter of Umar RA. The original Quran manuscript was kept with her.", category: "classical" },
  { id: 50, name: "Safiyyah", arabic: "صَفِيَّة", gender: "female", meaning: "Pure, sincere, chosen", origin: "Arabic", notes: "Wife of the Prophet ﷺ, originally from Banu Nadir. Aunt of the Prophet ﷺ also had this name.", category: "classical" },
  { id: 51, name: "Nadia", arabic: "نَادِيَة", gender: "female", meaning: "Caller, announcer", origin: "Arabic", category: "virtue" },
  { id: 52, name: "Layla", arabic: "لَيْلَى", gender: "female", meaning: "Night, dark beauty", origin: "Arabic", category: "nature" },
  { id: 53, name: "Nur", arabic: "نُور", gender: "female", meaning: "Light", origin: "Arabic", notes: "Nur is an attribute of Allah and the Quran in Surah An-Nur.", quranRef: "An-Nur 24:35", category: "quranic" },
  { id: 54, name: "Amina", arabic: "أَمِينَة", gender: "female", meaning: "Trustworthy, faithful", origin: "Arabic", notes: "Name of the Prophet's ﷺ beloved mother.", category: "classical" },
  { id: 55, name: "Hana", arabic: "هَنَاء", gender: "female", meaning: "Happiness, bliss", origin: "Arabic", category: "virtue" },
  { id: 56, name: "Sana", arabic: "سَنَاء", gender: "female", meaning: "Radiance, brilliance", origin: "Arabic", category: "virtue" },
  { id: 57, name: "Rania", arabic: "رَانِيَة", gender: "female", meaning: "Looking, gazing", origin: "Arabic", category: "virtue" },
  { id: 58, name: "Dina", arabic: "دِينَا", gender: "female", meaning: "Religion, way of life", origin: "Arabic", category: "virtue" },
  { id: 59, name: "Yasmin", arabic: "يَاسَمِين", gender: "female", meaning: "Jasmine flower", origin: "Persian/Arabic", category: "nature" },
  { id: 60, name: "Zara", arabic: "زَهْرَة", gender: "female", meaning: "Flower, blossom, radiance", origin: "Arabic", category: "nature" },
  { id: 61, name: "Lina", arabic: "لِينَة", gender: "female", meaning: "Tender, gentle", origin: "Arabic", quranRef: "Al-Hashr 59:5", category: "quranic" },
  { id: 62, name: "Malak", arabic: "مَلَاك", gender: "female", meaning: "Angel", origin: "Arabic", category: "virtue" },
  { id: 63, name: "Iman", arabic: "إِيمَان", gender: "both", meaning: "Faith, belief", origin: "Arabic", category: "virtue" },
  { id: 64, name: "Islam", arabic: "إِسْلَام", gender: "both", meaning: "Submission, peace", origin: "Arabic", category: "virtue" },
  { id: 65, name: "Rahma", arabic: "رَحْمَة", gender: "female", meaning: "Mercy, compassion", origin: "Arabic", category: "quranic" },
  { id: 66, name: "Rima", arabic: "رِيمَة", gender: "female", meaning: "White antelope", origin: "Arabic", category: "nature" },
  { id: 67, name: "Jannah", arabic: "جَنَّة", gender: "female", meaning: "Garden, Paradise", origin: "Arabic", category: "quranic" },
  { id: 68, name: "Samira", arabic: "سَمِيرَة", gender: "female", meaning: "Entertainer, companion in evening conversation", origin: "Arabic", category: "virtue" },

  // Both/Neutral
  { id: 69, name: "Taha", arabic: "طَه", gender: "male", meaning: "Pure, one of Allah's names for the Prophet ﷺ", origin: "Arabic", notes: "Name of a Quranic surah (20). Used to address the Prophet ﷺ.", quranRef: "Ta-Ha 20:1", category: "quranic" },
  { id: 70, name: "Yasin", arabic: "يَس", gender: "male", meaning: "O man (addressing the Prophet ﷺ)", origin: "Arabic", notes: "Opening letters of Surah Yasin — the 'heart of the Quran.'", quranRef: "Ya-Seen 36:1", category: "quranic" },
  { id: 71, name: "Hamid", arabic: "حَامِد", gender: "male", meaning: "Praiser of Allah, grateful", origin: "Arabic", category: "virtue" },
  { id: 72, name: "Jabir", arabic: "جَابِر", gender: "male", meaning: "Healer of broken bones, comforter", origin: "Arabic", category: "virtue" },
  { id: 73, name: "Karim", arabic: "كَرِيم", gender: "male", meaning: "Generous, noble, honorable", origin: "Arabic", notes: "Al-Karim is one of the 99 Names of Allah.", category: "quranic" },
  { id: 74, name: "Hakim", arabic: "حَكِيم", gender: "male", meaning: "Wise, judicious", origin: "Arabic", notes: "Al-Hakim is one of the 99 Names of Allah.", category: "quranic" },
  { id: 75, name: "Rahim", arabic: "رَحِيم", gender: "male", meaning: "Most merciful", origin: "Arabic", notes: "Ar-Rahim is one of Allah's greatest names. Can be used as a name meaning 'merciful person'.", category: "quranic" },
];

type GenderFilter = "all" | "male" | "female" | "both";
type CategoryFilter = "all" | IslamicName["category"];

const CATEGORY_CONFIG: Record<IslamicName["category"], { label: string; color: string }> = {
  prophetic: { label: "Prophets & Companions", color: "#16A34A" },
  quranic: { label: "Quranic", color: "#7C3AED" },
  classical: { label: "Classical", color: "#D97706" },
  nature: { label: "Nature", color: "#059669" },
  virtue: { label: "Virtue & Meaning", color: "#0891B2" },
};

export default function IslamicNamesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");
  const [selectedName, setSelectedName] = useState<IslamicName | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return NAMES.filter(n => {
      const matchGender = genderFilter === "all" || n.gender === genderFilter || n.gender === "both";
      const matchCat = catFilter === "all" || n.category === catFilter;
      const matchSearch = !q || n.name.toLowerCase().includes(q) || n.arabic.includes(q) || n.meaning.toLowerCase().includes(q);
      return matchGender && matchCat && matchSearch;
    });
  }, [search, genderFilter, catFilter]);

  const s = makeStyles(colors);

  if (selectedName) {
    const catCfg = CATEGORY_CONFIG[selectedName.category];
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedName(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>{selectedName.name}</Text>
          </View>
          <View style={[s.genderBadge, { backgroundColor: selectedName.gender === "male" ? "#0891B220" : selectedName.gender === "female" ? "#DC262620" : "#D9770620" }]}>
            <Text style={[s.genderBadgeText, { color: selectedName.gender === "male" ? "#0891B2" : selectedName.gender === "female" ? "#DC2626" : "#D97706" }]}>
              {selectedName.gender === "male" ? "♂ Male" : selectedName.gender === "female" ? "♀ Female" : "⚥ Both"}
            </Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[s.nameHero, { backgroundColor: colors.navy }]}>
            <Text style={s.nameHeroArabic}>{selectedName.arabic}</Text>
            <Text style={s.nameHeroName}>{selectedName.name}</Text>
            <Text style={[s.nameHeroMeaning, { color: colors.gold }]}>{selectedName.meaning}</Text>
            <Text style={[s.nameHeroOrigin, { color: "#FFFFFF70" }]}>Origin: {selectedName.origin}</Text>
          </View>

          <View style={[s.catRow, { backgroundColor: catCfg.color + "15", borderColor: catCfg.color + "40" }]}>
            <View style={[s.catDot, { backgroundColor: catCfg.color }]} />
            <Text style={[s.catText, { color: catCfg.color }]}>{catCfg.label}</Text>
          </View>

          {selectedName.notes && (
            <>
              <Text style={[s.secLabel, { color: colors.mutedForeground }]}>NOTES</Text>
              <View style={[s.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.notesText, { color: colors.foreground }]}>{selectedName.notes}</Text>
              </View>
            </>
          )}

          {selectedName.quranRef && (
            <View style={[s.quranRef, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Feather name="book-open" size={15} color={colors.primary} />
              <Text style={[s.quranRefText, { color: colors.foreground }]}>Mentioned in: <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>{selectedName.quranRef}</Text></Text>
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
          <Text style={[s.title, { color: colors.foreground }]}>Islamic Names</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>الأسماء الإسلامية</Text>
        </View>
        <View style={[s.countBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[s.countText, { color: colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput style={[s.searchInput, { color: colors.foreground }]} placeholder="Search by name or meaning…" placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity> : null}
      </View>

      {/* Gender filter */}
      <View style={s.genderRow}>
        {(["all", "male", "female"] as GenderFilter[]).map(g => (
          <TouchableOpacity key={g} style={[s.genderChip, { backgroundColor: genderFilter === g ? colors.primary : colors.card, borderColor: genderFilter === g ? colors.primary : colors.border }]} onPress={() => setGenderFilter(g)}>
            <Text style={[s.genderChipText, { color: genderFilter === g ? "#FFF" : colors.mutedForeground }]}>
              {g === "all" ? "All" : g === "male" ? "♂ Male" : "♀ Female"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catScrollContent}>
        <TouchableOpacity style={[s.catChip, { backgroundColor: catFilter === "all" ? colors.primary : colors.card, borderColor: catFilter === "all" ? colors.primary : colors.border }]} onPress={() => setCatFilter("all")}>
          <Text style={[s.catChipText, { color: catFilter === "all" ? "#FFF" : colors.mutedForeground }]}>All Categories</Text>
        </TouchableOpacity>
        {(Object.entries(CATEGORY_CONFIG) as [IslamicName["category"], typeof CATEGORY_CONFIG[IslamicName["category"]]][]).map(([key, cfg]) => (
          <TouchableOpacity key={key} style={[s.catChip, { backgroundColor: catFilter === key ? cfg.color : colors.card, borderColor: catFilter === key ? cfg.color : colors.border }]} onPress={() => setCatFilter(key)}>
            <Text style={[s.catChipText, { color: catFilter === key ? "#FFF" : colors.mutedForeground }]}>{cfg.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}>
        {filtered.map(name => {
          const catCfg = CATEGORY_CONFIG[name.category];
          return (
            <TouchableOpacity key={name.id} style={[s.nameCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelectedName(name)} activeOpacity={0.8}>
              <View style={[s.nameCardLeft, { backgroundColor: catCfg.color + "15" }]}>
                <Text style={[s.nameCardAr, { color: catCfg.color }]}>{name.arabic}</Text>
              </View>
              <View style={s.nameCardBody}>
                <View style={s.nameCardTop}>
                  <Text style={[s.nameCardName, { color: colors.foreground }]}>{name.name}</Text>
                  <Text style={[s.nameCardGender, { color: name.gender === "male" ? "#0891B2" : name.gender === "female" ? "#DC2626" : "#D97706" }]}>
                    {name.gender === "male" ? "♂" : name.gender === "female" ? "♀" : "⚥"}
                  </Text>
                </View>
                <Text style={[s.nameCardMeaning, { color: colors.mutedForeground }]}>{name.meaning}</Text>
                <View style={[s.nameCardCat, { backgroundColor: catCfg.color + "12" }]}>
                  <Text style={[s.nameCardCatText, { color: catCfg.color }]}>{catCfg.label}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={14} color={colors.border} />
            </TouchableOpacity>
          );
        })}
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
    genderBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    genderBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, gap: 8, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

    genderRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
    genderChip: { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
    genderChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

    catScroll: { maxHeight: 44, marginBottom: 4 },
    catScrollContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
    catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    catChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    listContent: { paddingHorizontal: 16, paddingTop: 8 },
    nameCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
    nameCardLeft: { width: 52, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    nameCardAr: { fontSize: 20 },
    nameCardBody: { flex: 1 },
    nameCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
    nameCardName: { fontSize: 15, fontFamily: "Inter_700Bold" },
    nameCardGender: { fontSize: 16 },
    nameCardMeaning: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
    nameCardCat: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" },
    nameCardCatText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

    // Detail
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },
    nameHero: { borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 16 },
    nameHeroArabic: { fontSize: 52, color: "#FFF", lineHeight: 72, marginBottom: 4 },
    nameHeroName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 8 },
    nameHeroMeaning: { fontSize: 16, fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 6 },
    nameHeroOrigin: { fontSize: 12, fontFamily: "Inter_400Regular" },
    catRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
    catDot: { width: 8, height: 8, borderRadius: 4 },
    catText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 6 },
    notesCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
    notesText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 24 },
    quranRef: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
    quranRefText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  });
}
