import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ROOTS_DATA: Record<string, any> = {
  "علم": {
    root: "ع-ل-م",
    translit: "‘A-L-M",
    meaning: "To know, understand, knowledge, sign, worlds",
    meaningUrdu: "جاننا، علم، نشانی، عالمین",
    occurrences: 854,
    derivatives: [
      { word: "عَلِمَ", form: "Alima", meaning: "He knew (Verb)" },
      { word: "عَلَّمَ", form: "Allama", meaning: "He taught (Verb)" },
      { word: "عِلْم", form: "Ilm", meaning: "Knowledge (Noun)" },
      { word: "عَالِم", form: "Alim", meaning: "All-Knowing (Participle)" },
      { word: "عَالَمِين", form: "Alameen", meaning: "Worlds (Noun Plural)" },
    ],
    verses: [
      { ref: "Al-Alaq 96:5", ar: "عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ", en: "Taught man that which he knew not." },
      { ref: "Ta-Ha 20:114", ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا", en: "And say: My Lord, increase me in knowledge." },
      { ref: "Al-Fatihah 1:2", ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", en: "Praise be to Allah, Lord of the worlds." },
    ],
  },
  "حمد": {
    root: "ح-م-د",
    translit: "H-M-D",
    meaning: "Praise, commendation with love and honour",
    meaningUrdu: "شکر، حمد، تعریف و توصیف",
    occurrences: 68,
    derivatives: [
      { word: "حَمْد", form: "Hamd", meaning: "Praise (Noun)" },
      { word: "حَمِيد", form: "Hameed", meaning: "Praiseworthy" },
      { word: "مُحَمَّد", form: "Muhammad", meaning: "The Praised One ﷺ" },
    ],
    verses: [
      { ref: "Al-Fatihah 1:2", ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", en: "All praise is due to Allah, Lord of the worlds." },
      { ref: "Al-Isra 17:79", ar: "عَسَىٰ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا", en: "May your Lord raise you to a Praised Station." },
    ],
  },
  "صبر": {
    root: "ص-ب-ر",
    translit: "S-B-R",
    meaning: "Patience, steadfastness, perseverance",
    meaningUrdu: "صبر، ثابت قدمی، استقلال",
    occurrences: 103,
    derivatives: [
      { word: "صَبَرَ", form: "Sabara", meaning: "He bore patiently" },
      { word: "صَبْر", form: "Sabr", meaning: "Patience" },
      { word: "صَابِرِين", form: "Sabireen", meaning: "The patient ones" },
    ],
    verses: [
      { ref: "Al-Baqarah 2:153", ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", en: "Seek help through patience and prayer." },
    ],
  },
};

const TAFSIR_PRESETS = [
  {
    surah: "Al-Fatihah (1:2)",
    arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    ibnKathir: "الألف واللام في 'الحمد' لاستغراق جميع المحامد والثناء لله وحده. والرب هو المالك المتصرف، والعالمين جمع عالم وهو كل موجود سوى الله.",
    maarifulQuran: "حمد کا مفہوم شکر سے وسیع ہے، یعنی ہر کمال و احسان کا اصل منبع اللہ ہے۔ اس آیت میں بندوں کو تمام نعمتوں پر اخلاص کے ساتھ خدا کا شکر ادا کرنے کی تعلیم دی گئی ہے۔",
    jalalayn: "الحمد لله: جملة خبرية قصد بها الثناء على الله بمضمونها من كونه تعالى مستحقاً للحمد الكامل. رب العالمين: مالك جميع الخلق من الإنس والجن وغيرهم.",
  },
  {
    surah: "Al-Baqarah (2:153)",
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    ibnKathir: "لما فرغ تعالى من بيان الأمر بالشكر شرع في بيان الصبر، والإرشاد إلى الاستعانة به وبالصلاة؛ فإن العبد إما أن يكون في نعمة فيشكر، أو في بلية فيصبر.",
    maarifulQuran: "دنیاوی و اخروی مشکلات کے حل کے لیے دو عظیم نسخے بتائے گئے: صبر (نفس پر قابو رکھنا) اور نماز (روحانی تعلقِ مع اللہ)۔ صبر کرنے والے کو اللہ کی خصوصی معیت حاصل ہوتی ہے۔",
    jalalayn: "استعينوا بالصبر: على الطاعة والبلاء. والصلاة: خصها بالذكر لعظمها. إن الله مع الصابرين: بالعون والنصرة والتأييد.",
  },
];

const NARRATORS_DATA = [
  {
    name: "Abu Hurairah ؓ",
    nameArabic: "أبو هريرة عبد الرحمن بن صخر الدوسي",
    hadiths: 5374,
    tabaqah: "صحابي جليل (Companion)",
    verdict: "أحفظ الصحابة لحديث رسول الله ﷺ",
    bio: "The most prolific narrator of Hadith. Accompanied the Prophet ﷺ closely and was blessed with miraculous memory.",
  },
  {
    name: "Aisha bint Abi Bakr ؓ",
    nameArabic: "أم المؤمنين عائشة الصديقة",
    hadiths: 2210,
    tabaqah: "أم المؤمنين وفقیہۃ الأمة",
    verdict: "أفقه نساء الأمة وأعلم الناس بالسنن",
    bio: "Beloved wife of the Prophet ﷺ, scholar of jurisprudence, medicine, and Islamic legal ethics.",
  },
  {
    name: "Abdullah ibn Umar ؓ",
    nameArabic: "عبد الله بن عمر بن الخطاب",
    hadiths: 2630,
    tabaqah: "صحابي، العبادلة الأربعة",
    verdict: "شديد الاتباع لآثار النبي ﷺ",
    bio: "Renowned for his meticulous observance of the Prophet's ﷺ precise Sunnah and pious asceticism.",
  },
];

export default function ResearchSuiteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"roots" | "tafsir" | "narrators">("roots");

  const [selectedRoot, setSelectedRoot] = useState<string>("علم");
  const [selectedTafsirIndex, setSelectedTafsirIndex] = useState(0);
  const [activeTafsirScholar, setActiveTafsirScholar] = useState<"ibnKathir" | "maarifulQuran" | "jalalayn">("maarifulQuran");

  const currentRoot = ROOTS_DATA[selectedRoot];
  const currentTafsir = TAFSIR_PRESETS[selectedTafsirIndex];

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>مجمع البحوث الإسلامية</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Scholar & Academic Research Suite</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs Switcher */}
      <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("roots")}
          style={[s.tabItem, activeTab === "roots" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[s.tabText, { color: activeTab === "roots" ? colors.primary : colors.mutedForeground }]}>
            مادہ قرآنی (Roots)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("tafsir")}
          style={[s.tabItem, activeTab === "tafsir" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[s.tabText, { color: activeTab === "tafsir" ? colors.primary : colors.mutedForeground }]}>
            تقابلی تفاسیر (Tafsir)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("narrators")}
          style={[s.tabItem, activeTab === "narrators" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[s.tabText, { color: activeTab === "narrators" ? colors.primary : colors.mutedForeground }]}>
            رجال الحدیث (Narrators)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* 1. ROOT WORDS */}
        {activeTab === "roots" && (
          <View style={{ gap: 14 }}>
            {/* Root selector pills */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {Object.keys(ROOTS_DATA).map((k) => (
                <TouchableOpacity
                  key={k}
                  onPress={() => setSelectedRoot(k)}
                  style={[s.pill, { backgroundColor: selectedRoot === k ? colors.primary : colors.card, borderColor: colors.border }]}
                >
                  <Text style={[s.pillArabic, { color: selectedRoot === k ? "#FFF" : colors.foreground }]}>{k}</Text>
                  <Text style={[s.pillSub, { color: selectedRoot === k ? "#FFFFFFCC" : colors.mutedForeground }]}>
                    {ROOTS_DATA[k].occurrences}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentRoot && (
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={[s.rootBig, { color: colors.primary }]}>{currentRoot.root}</Text>
                    <Text style={[s.rootTranslit, { color: colors.mutedForeground }]}>{currentRoot.translit}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[s.badgeText, { color: colors.primary }]}>{currentRoot.occurrences} قرآنی مقامات</Text>
                  </View>
                </View>

                <View style={{ marginVertical: 12, padding: 10, borderRadius: 8, backgroundColor: colors.muted + "40" }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{currentRoot.meaningUrdu}</Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>{currentRoot.meaning}</Text>
                </View>

                {/* Derivatives */}
                <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>مشتقات و اوزان (Derivatives):</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 8 }}>
                  {currentRoot.derivatives.map((d: any, i: number) => (
                    <View key={i} style={[s.derivBox, { backgroundColor: colors.muted + "30", borderColor: colors.border }]}>
                      <Text style={[s.derivWord, { color: colors.foreground }]}>{d.word}</Text>
                      <Text style={[s.derivMeaning, { color: colors.mutedForeground }]}>{d.form}</Text>
                    </View>
                  ))}
                </View>

                {/* Verses */}
                <Text style={[s.sectionTitle, { color: colors.mutedForeground, marginTop: 12 }]}>نمونۂ آیات (Quranic Verses):</Text>
                <View style={{ gap: 8, marginTop: 8 }}>
                  {currentRoot.verses.map((v: any, idx: number) => (
                    <View key={idx} style={[s.verseBox, { backgroundColor: colors.muted + "20", borderColor: colors.border }]}>
                      <Text style={[s.verseRef, { color: colors.primary }]}>{v.ref}</Text>
                      <Text style={[s.verseAr, { color: colors.foreground }]}>{v.ar}</Text>
                      <Text style={[s.verseEn, { color: colors.mutedForeground }]}>{v.en}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* 2. COMPARATIVE TAFSIR */}
        {activeTab === "tafsir" && (
          <View style={{ gap: 14 }}>
            {/* Presets */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {TAFSIR_PRESETS.map((t, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedTafsirIndex(idx)}
                  style={[s.pill, { backgroundColor: selectedTafsirIndex === idx ? colors.primary : colors.card, borderColor: colors.border }]}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: selectedTafsirIndex === idx ? "#FFF" : colors.foreground }}>
                    {t.surah}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Verse Preview */}
            <View style={[s.card, { backgroundColor: colors.navy, padding: 16, alignItems: "center" }]}>
              <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "700", textAlign: "center", lineHeight: 28, fontFamily: Platform.OS === "ios" ? "Geeza Pro" : "serif" }}>
                {currentTafsir.arabic}
              </Text>
            </View>

            {/* Scholar Selector */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {[
                { id: "maarifulQuran", label: "معارف القرآن (مفتی شفیعؒ)" },
                { id: "ibnKathir", label: "تفسير ابن كثير" },
                { id: "jalalayn", label: "تفسير الجلالين" },
              ].map((sch) => (
                <TouchableOpacity
                  key={sch.id}
                  onPress={() => setActiveTafsirScholar(sch.id as any)}
                  style={[
                    s.scholarBtn,
                    {
                      backgroundColor: activeTafsirScholar === sch.id ? colors.primary : colors.card,
                      borderColor: activeTafsirScholar === sch.id ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: activeTafsirScholar === sch.id ? "#FFF" : colors.foreground, textAlign: "center" }}>
                    {sch.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tafsir Content Card */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16 }]}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8 }}>
                {activeTafsirScholar === "maarifulQuran" && "معارف القرآن — مفتی محمد شفیع عثمانیؒ"}
                {activeTafsirScholar === "ibnKathir" && "تفسیر القرآن العظیم — الحافظ عماد الدین ابن کثیرؒ"}
                {activeTafsirScholar === "jalalayn" && "تفسیر الجلالین — المحلی و السیوطیؒ"}
              </Text>
              <Text style={{ fontSize: 13, lineHeight: 22, color: colors.foreground, textAlign: "right" }}>
                {currentTafsir[activeTafsirScholar]}
              </Text>
            </View>
          </View>
        )}

        {/* 3. NARRATORS */}
        {activeTab === "narrators" && (
          <View style={{ gap: 12 }}>
            {NARRATORS_DATA.map((n, idx) => (
              <View key={idx} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16, gap: 8 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{n.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.primary, fontStyle: "italic" }}>{n.nameArabic}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[s.badgeText, { color: colors.primary }]}>{n.hadiths} روایات</Text>
                  </View>
                </View>

                <View style={{ padding: 8, borderRadius: 6, backgroundColor: colors.muted + "30" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.foreground }}>حکم و مقام: <Text style={{ fontWeight: "400" }}>{n.verdict}</Text></Text>
                </View>

                <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>{n.bio}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    headerCenter: { alignItems: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700" },
    headerSub: { fontSize: 11 },

    tabRow: { flexDirection: "row", borderBottomWidth: 1 },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabText: { fontSize: 12, fontWeight: "600" },

    content: { padding: 16 },
    card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },

    pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: "center" },
    pillArabic: { fontSize: 15, fontWeight: "700" },
    pillSub: { fontSize: 10 },

    rootBig: { fontSize: 24, fontWeight: "700" },
    rootTranslit: { fontSize: 12 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: "600" },

    sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
    derivBox: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignItems: "center" },
    derivWord: { fontSize: 14, fontWeight: "700" },
    derivMeaning: { fontSize: 10 },

    verseBox: { padding: 10, borderRadius: 8, borderWidth: 1, gap: 4 },
    verseRef: { fontSize: 11, fontWeight: "700" },
    verseAr: { fontSize: 15, textAlign: "right", fontWeight: "600" },
    verseEn: { fontSize: 11 },

    scholarBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  });
}
