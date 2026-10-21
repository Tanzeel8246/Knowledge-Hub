import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetProgressDashboard } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Gregorian to Hijri (Kuwaiti algorithm)
function gregorianToHijri(gYear: number, gMonth: number, gDay: number) {
  let jd = Math.floor((14 - gMonth) / 12);
  let y = gYear + 4800 - jd;
  let m = gMonth + 12 * jd - 3;
  let jdn = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  let l = jdn - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

const HIJRI_MONTHS_AR = [
  "مُحَرَّم", "صَفَر", "رَبِيع الأَوَّل", "رَبِيع الثَّانِي",
  "جُمَادَى الأُولَى", "جُمَادَى الثَّانِيَة", "رَجَب", "شَعْبَان",
  "رَمَضَان", "شَوَّال", "ذُو القَعْدَة", "ذُو الحِجَّة",
];

const DAILY_HADITHS = [
  { text: "The strong is not the one who overcomes people by his strength, but the strong is the one who controls himself while in anger.", narrator: "Abu Hurayrah (RA)", source: "Bukhari 6114 | Muslim 2609" },
  { text: "None of you truly believes until he loves for his brother what he loves for himself.", narrator: "Anas ibn Malik (RA)", source: "Bukhari 13 | Muslim 45" },
  { text: "The best of you is the one who learns the Quran and teaches it.", narrator: "Uthman ibn Affan (RA)", source: "Bukhari 5027" },
  { text: "Make things easy and do not make them difficult. Cheer people up and do not drive them away.", narrator: "Anas ibn Malik (RA)", source: "Bukhari 69 | Muslim 1734" },
  { text: "The most beloved of deeds to Allah are those that are consistent, even if they are few.", narrator: "Aisha (RA)", source: "Bukhari 6464 | Muslim 783" },
  { text: "Smiling at your brother is an act of charity.", narrator: "Abu Dharr (RA)", source: "Tirmidhi 1956" },
  { text: "Whoever believes in Allah and the Last Day should speak a good word or remain silent.", narrator: "Abu Hurayrah (RA)", source: "Bukhari 6018 | Muslim 47" },
  { text: "A person is on the religion of his close friend, so let each of you look at whom he befriends.", narrator: "Abu Hurayrah (RA)", source: "Tirmidhi 2378 | Abu Dawud 4833" },
  { text: "The world is a prison for the believer and a paradise for the disbeliever.", narrator: "Abu Hurayrah (RA)", source: "Muslim 2956" },
  { text: "Seek knowledge even unto China.", narrator: "Anas ibn Malik (RA)", source: "Ibn Majah 224 | Da'if according to many" },
  { text: "Do not get angry, and Paradise will be yours.", narrator: "Companion (RA)", source: "Tabarani | Sahih" },
  { text: "Whoever removes a hardship from a believer in this world, Allah will remove a hardship from him on the Day of Judgment.", narrator: "Abu Hurayrah (RA)", source: "Muslim 2699" },
  { text: "Feed the hungry, visit the sick, and free the captives.", narrator: "Abu Musa al-Ash'ari (RA)", source: "Bukhari 5373" },
  { text: "Every act of kindness is charity.", narrator: "Jabir (RA)", source: "Muslim 1005" },
];

const DAILY_VERSES = [
  { arabic: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ", translation: "But perhaps you hate a thing and it is good for you.", ref: "Al-Baqarah 2:216", surah: 2 },
  { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "For indeed, with hardship will be ease.", ref: "Ash-Sharh 94:5", surah: 94 },
  { arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", translation: "And when My servants ask you about Me — indeed I am near.", ref: "Al-Baqarah 2:186", surah: 2 },
  { arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", translation: "Our Lord, give us in this world good and in the Hereafter good.", ref: "Al-Baqarah 2:201", surah: 2 },
  { arabic: "وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَىٰ بِاللَّهِ وَكِيلًا", translation: "And rely upon Allah; and sufficient is Allah as Disposer of affairs.", ref: "Al-Ahzab 33:3", surah: 33 },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translation: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153", surah: 2 },
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", translation: "And whoever relies upon Allah — then He is sufficient for him.", ref: "At-Talaq 65:3", surah: 65 },
  { arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", translation: "Say: He is Allah, the One.", ref: "Al-Ikhlas 112:1", surah: 112 },
  { arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "All praise is due to Allah, Lord of the worlds.", ref: "Al-Fatihah 1:2", surah: 1 },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Indeed, with hardship comes ease.", ref: "Ash-Sharh 94:6", surah: 94 },
  { arabic: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ", translation: "And be patient, for your patience is only through Allah.", ref: "An-Nahl 16:127", surah: 16 },
  { arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", translation: "O you who have believed, seek help through patience and prayer.", ref: "Al-Baqarah 2:153", surah: 2 },
  { arabic: "وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ", translation: "And We will surely test you with something of fear and hunger.", ref: "Al-Baqarah 2:155", surah: 2 },
  { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", translation: "Sufficient for us is Allah, and He is the best Disposer of affairs.", ref: "Al-Imran 3:173", surah: 3 },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { language, setLanguage, t, isUrdu, isArabic } = useLanguage();
  const { data: progress } = useGetProgressDashboard();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const [adjustment, setAdjustment] = React.useState<number>(0);

  React.useEffect(() => {
    AsyncStorage.getItem("@app_settings").then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed.hijriAdjustment === "number") setAdjustment(parsed.hijriAdjustment);
        } catch {}
      }
    });
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + adjustment);
    return d;
  }, [adjustment]);

  const hijri = useMemo(() => {
    return gregorianToHijri(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }, [today]);

  const gregFormatted = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Rotate verse daily (day of year as seed)
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyVerse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
  const dailyHadith = DAILY_HADITHS[(dayOfYear + 7) % DAILY_HADITHS.length];

  const s = makeStyles(colors);

  const featuredActions = [
    { icon: "book-open-variant", label: "تلاوتِ قرآن", labelEn: "Quran", route: "/quran", color: colors.teal },
    { icon: "mosque", label: "اوقاتِ صلوٰۃ", labelEn: "Prayer Times", route: "/prayer-times", color: "#0891B2" },
    { icon: "compass", label: "قبلہ و شمسی سایہ", labelEn: "Qibla & Sun", route: "/qibla", color: "#7C3AED" },
    { icon: "script-text-outline", label: "کتبِ حدیث", labelEn: "Hadith", route: "/hadith", color: colors.gold },
    { icon: "book-search", label: "البحث الشامل", labelEn: "Shamela Search", route: "/research-search", color: "#D97706" },
    { icon: "library", label: "اسلامی لائبریری", labelEn: "Books", route: "/books", color: colors.primary },
  ];

  const quickActions = [
    { icon: "book-search", label: "Shamela Search", route: "/research-search", color: "#D97706" },
    { icon: "book-open-variant", label: "Read Quran", route: "/quran", color: colors.teal },
    { icon: "script-text-outline", label: "Hadith", route: "/hadith", color: colors.gold },
    { icon: "library", label: "Books", route: "/books", color: colors.primary },
    { icon: "school-outline", label: "Learn", route: "/learn", color: "#8B5CF6" },
    { icon: "mosque", label: "Prayer Times", route: "/prayer-times", color: "#0891B2" },
    { icon: "map-marker-radius", label: "Mosques", route: "/mosques", color: "#0D9488" },
    { icon: "baby-face-outline", label: "Kids Corner", route: "/kids-corner", color: "#F59E0B" },
    { icon: "counter", label: "Tasbih", route: "/tasbih", color: "#16A34A" },
    { icon: "compass", label: "Qibla", route: "/qibla", color: "#7C3AED" },
    { icon: "heart", label: "Duas", route: "/duas", color: "#DC2626" },
    { icon: "star-crescent", label: "99 Names", route: "/names-of-allah", color: "#D97706" },
    { icon: "magnify", label: "Search Quran", route: "/quran-search", color: "#0891B2" },
    { icon: "calendar-month", label: "Calendar", route: "/islamic-calendar", color: "#059669" },
    { icon: "notebook", label: "Workspace", route: "/(tabs)/workspace", color: "#6366F1" },
    { icon: "calculator", label: "Zakat", route: "/zakat-calculator", color: "#D97706" },
    { icon: "scale-balance", label: "Inheritance", route: "/inheritance-calculator", color: "#B45309" },
    { icon: "book-open-page-variant", label: "Research", route: "/research-suite", color: "#0D9488" },
    { icon: "heart-pulse", label: "Tazkiyah", route: "/spiritual-suite", color: "#E11D48" },
    { icon: "check-circle", label: "Prayer Log", route: "/prayer-tracker", color: "#16A34A" },
    { icon: "help-circle", label: "Islamic Quiz", route: "/islamic-quiz", color: "#8B5CF6" },
    { icon: "weather-sunny", label: "Adhkar", route: "/adhkar", color: "#F59E0B" },
    { icon: "book-open-variant", label: "Hifz Tracker", route: "/hifz-tracker", color: "#7C3AED" },
    { icon: "moon-waning-crescent", label: "Ramadan", route: "/ramadan-tracker", color: "#1E3A5F" },
    { icon: "hands-pray", label: "Salah Guide", route: "/salah-guide", color: "#059669" },
    { icon: "timeline-text-outline", label: "History", route: "/islamic-history", color: "#78716C" },
    { icon: "alphabetical", label: "Arabic", route: "/arabic-alphabet", color: "#0891B2" },
    { icon: "account-group", label: "Prophets", route: "/prophets", color: "#059669" },
    { icon: "water", label: "Wudu", route: "/wudu-guide", color: "#0891B2" },
    { icon: "music-note", label: "Tajweed", route: "/tajweed", color: "#7C3AED" },
    { icon: "book-open-page-variant", label: "Seerah", route: "/seerah", color: "#D97706" },
    { icon: "account-heart", label: "Names", route: "/islamic-names", color: "#DC2626" },
    { icon: "layers", label: "Quran Juz", route: "/quran-juz", color: "#059669", isMCIcon: false },
    { icon: "book-alphabet", label: "Glossary", route: "/glossary", color: "#7C3AED" },
    { icon: "food-off", label: "Fasting", route: "/fasting-tracker", color: "#0891B2" },
    { icon: "download", label: "Downloads", route: "/downloads", color: "#16A34A" },
    { icon: "shield-check", label: "Fatawa Archive", route: "/fatawa-archive", color: "#B45309" },
  ];

  const [activeCategory, setActiveCategory] = React.useState<"all" | "worship" | "research" | "learning" | "tools">("worship");

  const categories = [
    { id: "all", label: "تمام (All)" },
    { id: "worship", label: "عبادات (Worship)" },
    { id: "research", label: "تحقیق و کتب (Research)" },
    { id: "learning", label: "تعلیم و تربیت (Learning)" },
    { id: "tools", label: "ٹولز (Tools)" },
  ] as const;

  const filteredActions = useMemo(() => {
    if (activeCategory === "all") return quickActions;
    if (activeCategory === "worship") {
      return quickActions.filter(a => ["Read Quran", "Prayer Times", "Tasbih", "Qibla", "Duas", "Prayer Log", "Adhkar", "Ramadan", "Fasting", "Mosques"].includes(a.label));
    }
    if (activeCategory === "research") {
      return quickActions.filter(a => ["Hadith", "Books", "Search Quran", "Quran Juz", "Research", "History", "Prophets", "Seerah", "Glossary"].includes(a.label));
    }
    if (activeCategory === "learning") {
      return quickActions.filter(a => ["Learn", "Kids Corner", "Islamic Quiz", "Hifz Tracker", "Salah Guide", "Arabic", "Wudu", "Tajweed", "Names"].includes(a.label));
    }
    if (activeCategory === "tools") {
      return quickActions.filter(a => ["Calendar", "Workspace", "Zakat", "Inheritance", "Tazkiyah", "99 Names", "Downloads"].includes(a.label));
    }
    return quickActions;
  }, [activeCategory, quickActions]);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 100 }]}
      >
        {/* Brand Bar: Logo + App Name (المفتاح) + Dynamic Language Switcher */}
        <View style={s.brandBar}>
          <View style={s.brandLeft}>
            <Image
              source={require("@/assets/images/app-logo.png")}
              style={s.appLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.brandName, { color: colors.foreground }]}>{t.appName}</Text>
              <Text style={[s.brandSubtitle, { color: colors.gold }]} numberOfLines={1}>{t.appSubtitle}</Text>
            </View>
          </View>

          {/* Dynamic Language Switcher */}
          <View style={[s.langPillsWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["ur", "en", "ar"] as const).map(l => (
              <TouchableOpacity
                key={l}
                style={[s.langPill, language === l && { backgroundColor: colors.primary }]}
                onPress={() => setLanguage(l)}
              >
                <Text style={[s.langPillText, { color: language === l ? "#FFF" : colors.mutedForeground }]}>
                  {l === "ur" ? "اردو" : l === "en" ? "EN" : "عربي"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Greeting Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: colors.mutedForeground }]}>{greeting()}</Text>
            <Text style={[s.name, { color: colors.foreground }]}>{user?.name ?? "Student"} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")} style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[s.avatarText, { color: colors.primaryForeground }]}>
              {(user?.name ?? "?")[0].toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hijri Date + Gregorian Banner */}
        <TouchableOpacity style={[s.dateBanner, { backgroundColor: colors.navy }]} onPress={() => router.push("/islamic-calendar" as any)}>
          <View style={s.dateLeft}>
            <Text style={s.hijriDate}>{hijri.day}</Text>
            <View>
              <Text style={[s.hijriMonth, { color: colors.gold }]}>ہجری: {HIJRI_MONTHS_AR[hijri.month - 1]}</Text>
              <Text style={s.hijriYear}>{hijri.year} AH</Text>
            </View>
          </View>
          <View style={[s.dateDivider, { backgroundColor: "#FFFFFF20" }]} />
          <View style={s.dateRight}>
            <Text style={s.hijriNameEn}>عیسوی تاریخ</Text>
            <Text style={s.gregDate}>{gregFormatted}</Text>
          </View>
          <Feather name="chevron-right" size={16} color="#FFFFFF50" />
        </TouchableOpacity>

        {/* Stats Row */}
        {progress && (
          <View style={s.statsRow}>
            <StatCard label="Streak" value={`${progress.readingStreak}d`} icon="zap" color={colors.gold} colors={colors} />
            <StatCard label="Minutes" value={`${progress.totalReadingMinutes}`} icon="clock" color={colors.teal} colors={colors} />
            <StatCard label="Lessons" value={`${progress.completedLessons}`} icon="check-circle" color="#8B5CF6" colors={colors} />
          </View>
        )}

        {/* Daily Verse */}
        <TouchableOpacity
          style={[s.verseCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}
          onPress={() => router.push(`/quran/${dailyVerse.surah}` as any)}
        >
          <View style={s.verseHeader}>
            <View style={[s.verseBadge, { backgroundColor: colors.primary + "20" }]}>
              <MaterialCommunityIcons name="book-open-variant" size={14} color={colors.primary} />
              <Text style={[s.verseBadgeText, { color: colors.primary }]}>Verse of the Day</Text>
            </View>
            <Text style={[s.verseRef, { color: colors.mutedForeground }]}>{dailyVerse.ref}</Text>
          </View>
          <Text style={[s.verseArabic, { color: colors.foreground }]}>{dailyVerse.arabic}</Text>
          <Text style={[s.verseTrans, { color: colors.mutedForeground }]}>"{dailyVerse.translation}"</Text>
          <View style={[s.verseFooter, { borderTopColor: colors.border }]}>
            <Text style={[s.verseReadMore, { color: colors.primary }]}>Read full Surah</Text>
            <Feather name="arrow-right" size={13} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Hadith of the Day */}
        <TouchableOpacity
          style={[s.hadithCard, { backgroundColor: colors.card, borderColor: colors.gold + "40" }]}
          onPress={() => router.push("/hadith" as any)}
        >
          <View style={s.verseHeader}>
            <View style={[s.verseBadge, { backgroundColor: colors.gold + "20" }]}>
              <MaterialCommunityIcons name="script-text-outline" size={14} color={colors.gold} />
              <Text style={[s.verseBadgeText, { color: colors.gold }]}>Hadith of the Day</Text>
            </View>
            <Text style={[s.verseRef, { color: colors.mutedForeground }]}>{dailyHadith.source}</Text>
          </View>
          <Text style={[s.verseTrans, { color: colors.foreground, fontStyle: "normal", fontSize: 15, lineHeight: 24, marginBottom: 8 }]}>"{dailyHadith.text}"</Text>
          <Text style={[s.verseRef, { color: colors.gold }]}>— {dailyHadith.narrator}</Text>
        </TouchableOpacity>

        {/* Primary Core Tools (بنیادی خدمات) */}
        <Text style={[s.sectionTitle, { color: colors.foreground, marginBottom: 10 }]}>بنیادی سہولیات (Core Essentials)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {featuredActions.map(f => (
            <TouchableOpacity
              key={f.route}
              style={{
                width: "31%",
                backgroundColor: colors.card,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 8,
                alignItems: "center",
                borderWidth: 1.5,
                borderColor: f.color + "30",
                gap: 6,
              }}
              onPress={() => router.push(f.route as any)}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.color + "18", alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name={f.icon as any} size={24} color={f.color} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
                {f.label}
              </Text>
              <Text style={{ fontSize: 10, color: colors.mutedForeground, textAlign: "center" }}>
                {f.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions Header & Category Filters */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={[s.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>تمام ٹولز و خدمات ({filteredActions.length})</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id as any)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                backgroundColor: activeCategory === cat.id ? colors.primary : colors.card,
                borderColor: activeCategory === cat.id ? colors.primary : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_600SemiBold",
                  color: activeCategory === cat.id ? colors.primaryForeground : colors.mutedForeground,
                }}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.quickActions}>
          {filteredActions.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[s.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[s.quickIcon, { backgroundColor: (a.color ?? colors.primary) + "20" }]}>
                <MaterialCommunityIcons name={a.icon as any} size={26} color={a.color ?? colors.primary} />
              </View>
              <Text style={[s.quickLabel, { color: colors.foreground }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        {progress?.recentActivity && progress.recentActivity.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
            {progress.recentActivity.slice(0, 4).map((act, i) => (
              <View key={act.id ?? i} style={[s.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.activityDot, { backgroundColor: colors.primary }]} />
                <Text style={[s.activityText, { color: colors.foreground }]}>{act.description}</Text>
                <Text style={[s.activityTime, { color: colors.mutedForeground }]}>
                  {new Date(act.timestamp).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Quick Links to Tools */}
        <Text style={[s.sectionTitle, { color: colors.foreground }]}>Daily Tools</Text>
        <View style={s.toolsRow}>
          {[
            { icon: "mosque", label: "Prayer Times", route: "/prayer-times", color: "#0891B2", desc: "Salah schedule" },
            { icon: "counter", label: "Tasbih", route: "/tasbih", color: "#16A34A", desc: "Dhikr counter" },
            { icon: "compass", label: "Qibla", route: "/qibla", color: "#7C3AED", desc: "Kaaba direction" },
          ].map(t => (
            <TouchableOpacity
              key={t.label}
              style={[s.toolCard, { backgroundColor: t.color + "15", borderColor: t.color + "30" }]}
              onPress={() => router.push(t.route as any)}
            >
              <MaterialCommunityIcons name={t.icon as any} size={22} color={t.color} />
              <Text style={[s.toolLabel, { color: t.color }]}>{t.label}</Text>
              <Text style={[s.toolDesc, { color: t.color + "AA" }]}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, color, colors }: any) {
  const s = makeStyles(colors);
  return (
    <View style={[s.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={18} color={color} />
      <Text style={[s.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { paddingHorizontal: 16 },

    brandBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    brandLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    appLogo: {
      width: 44,
      height: 44,
      borderRadius: 12,
    },
    brandName: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.3,
    },
    brandSubtitle: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      marginTop: 1,
    },
    langPillsWrap: {
      flexDirection: "row",
      borderRadius: 20,
      padding: 3,
      borderWidth: 1,
      gap: 2,
    },
    langPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 14,
    },
    langPillText: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
    },

    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
    name: { fontSize: 22, fontFamily: "Inter_700Bold" },
    avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    avatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },

    dateBanner: { borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 },
    dateLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    hijriDate: { fontSize: 42, fontFamily: "Inter_700Bold", color: "#FFF", lineHeight: 46 },
    hijriMonth: { fontSize: 16, fontFamily: "Inter_700Bold" },
    hijriYear: { fontSize: 12, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    dateDivider: { width: 1, height: 40 },
    dateRight: { flex: 1 },
    hijriNameEn: { fontSize: 13, color: "#FFFFFF90", fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    gregDate: { fontSize: 12, color: "#FFFFFF70", fontFamily: "Inter_400Regular" },

    statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 5, borderWidth: 1 },
    statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },

    verseCard: { borderRadius: 16, padding: 16, borderWidth: 1.5, marginBottom: 20 },
    verseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    verseBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    verseBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    verseRef: { fontSize: 11, fontFamily: "Inter_400Regular" },
    verseArabic: { fontSize: 22, lineHeight: 38, textAlign: "right", marginBottom: 10, fontFamily: "Inter_400Regular" },
    verseTrans: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", fontStyle: "italic", marginBottom: 12 },
    verseFooter: { flexDirection: "row", alignItems: "center", gap: 5, borderTopWidth: 1, paddingTop: 10 },
    verseReadMore: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
    quickAction: { width: "47%", borderRadius: 14, padding: 14, alignItems: "center", gap: 8, borderWidth: 1 },
    quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    quickLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },

    activityItem: { flexDirection: "row", alignItems: "center", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, gap: 10 },
    activityDot: { width: 8, height: 8, borderRadius: 4 },
    activityText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
    activityTime: { fontSize: 11, fontFamily: "Inter_400Regular" },

    toolsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    toolCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4, borderWidth: 1 },
    toolLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    toolDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
    hadithCard: { borderRadius: 16, padding: 16, borderWidth: 1.5, marginBottom: 20 },
  });
}
