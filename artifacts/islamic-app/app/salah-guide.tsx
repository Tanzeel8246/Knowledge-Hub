import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface PrayerStep {
  num: number;
  title: string;
  arabic?: string;
  transliteration?: string;
  translation?: string;
  detail: string;
  posture: string; // emoji/symbol representing posture
}

interface PrayerInfo {
  id: string;
  name: string;
  arabic: string;
  rakaat: number;
  time: string;
  color: string;
  description: string;
}

const PRAYERS: PrayerInfo[] = [
  { id: "fajr", name: "Fajr", arabic: "الفجر", rakaat: 2, time: "Dawn — before sunrise", color: "#7C3AED", description: "The dawn prayer — 2 Fardh rakaat. Recite silently." },
  { id: "dhuhr", name: "Dhuhr", arabic: "الظهر", rakaat: 4, time: "Midday — after zenith", color: "#0891B2", description: "The midday prayer — 4 Fardh rakaat. Recite silently." },
  { id: "asr", name: "Asr", arabic: "العصر", rakaat: 4, time: "Afternoon", color: "#D97706", description: "The afternoon prayer — 4 Fardh rakaat. Recite silently." },
  { id: "maghrib", name: "Maghrib", arabic: "المغرب", rakaat: 3, time: "Just after sunset", color: "#DC2626", description: "The sunset prayer — 3 Fardh rakaat. First 2 recite aloud, 3rd silently." },
  { id: "isha", name: "Isha", arabic: "العشاء", rakaat: 4, time: "Night", color: "#1E3A5F", description: "The night prayer — 4 Fardh rakaat. First 2 recite aloud, last 2 silently." },
];

const GENERAL_STEPS: PrayerStep[] = [
  {
    num: 1,
    title: "Wudu (Purification)",
    posture: "💧",
    detail: "Make wudu (ablution) before praying. Wash hands, mouth, nose, face, arms up to elbows, wipe head, wash ears, and wash feet up to ankles — each part three times.",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    translation: "In the name of Allah",
  },
  {
    num: 2,
    title: "Face the Qibla",
    posture: "🧭",
    detail: "Face the direction of Makkah (Qibla). Use the Qibla Compass in this app to find the exact direction. Stand upright with feet shoulder-width apart.",
  },
  {
    num: 3,
    title: "Niyyah (Intention)",
    posture: "🤲",
    detail: "Make intention in your heart to pray. You do not need to say niyyah aloud — it is an act of the heart. Intend: 'I intend to pray [Fajr/Dhuhr/Asr/Maghrib/Isha], 2/4/3/4 rakaat, for Allah.'",
  },
  {
    num: 4,
    title: "Takbiratul Ihram — Opening",
    posture: "🙌",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translation: "Allah is the Greatest",
    detail: "Raise both hands to the level of your shoulders or earlobes, palms facing forward. Say 'Allahu Akbar.' This marks the official beginning of the prayer. Place right hand over left on chest.",
  },
  {
    num: 5,
    title: "Opening Supplication (Du'a Al-Istiftah)",
    posture: "🧍",
    arabic: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَٰهَ غَيْرُكَ",
    transliteration: "Subhanakal-lahumma wa bihamdika wa tabarakasmuka wa ta'ala jadduka wa la ilaha ghayruk",
    translation: "Glory be to You O Allah, and praise be to You. Blessed is Your name and Exalted is Your Majesty. There is no god but You.",
    detail: "Recite silently after Takbir before Al-Fatihah. This is Sunnah. Then seek refuge: A'udhu billahi minash-shaytan-ir-rajeem.",
  },
  {
    num: 6,
    title: "Recite Al-Fatihah",
    posture: "🧍",
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    transliteration: "Bismillahir-rahmanir-raheem. Al-hamdu lillahi rabbil-'alamin…",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful. All praise is due to Allah, Lord of all the worlds…",
    detail: "Recite Surah Al-Fatihah (all 7 verses). It is obligatory in every rakaat. After finishing say 'Ameen' silently (or aloud in congregation). Then recite any other Surah or verses (minimum 3 ayahs) in the first two rakaat.",
  },
  {
    num: 7,
    title: "Ruku (Bowing)",
    posture: "🫄",
    arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
    transliteration: "Subhana Rabbiyal-'Azeem",
    translation: "Glory be to my Lord, the Most Great",
    detail: "Say Allahu Akbar and bow with your back flat, parallel to the ground. Place palms on knees. Repeat the tasbeeh at least 3 times. Keep head level with your back.",
  },
  {
    num: 8,
    title: "Rising from Ruku (I'tidal)",
    posture: "🧍",
    arabic: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ ۝ رَبَّنَا لَكَ الْحَمْدُ",
    transliteration: "Sami'allahu liman hamidah — Rabbana lakal-hamd",
    translation: "Allah hears whoever praises Him — Our Lord, to You belongs all praise",
    detail: "Rise up saying 'Sami'Allahu liman hamidah.' When fully upright, say 'Rabbana lakal-hamd.' Stand momentarily still before going into sujud.",
  },
  {
    num: 9,
    title: "Sujud (Prostration)",
    posture: "🙇",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    transliteration: "Subhana Rabbiyal-A'la",
    translation: "Glory be to my Lord, the Most High",
    detail: "Say Allahu Akbar and go down. Seven body parts must touch the ground: forehead+nose, both palms, both knees, toes of both feet. Repeat tasbeeh at least 3 times. This is the closest a servant is to Allah.",
  },
  {
    num: 10,
    title: "Sitting between two Sajdahs (Jalsa)",
    posture: "🧘",
    arabic: "رَبِّ اغْفِرْ لِي",
    transliteration: "Rabbighfir li",
    translation: "My Lord, forgive me",
    detail: "Rise from sujud saying Allahu Akbar. Sit briefly on your left foot, right foot upright. Say 'Rabbighfir li' at least once. Then perform the second sujud.",
  },
  {
    num: 11,
    title: "Second Sujud",
    posture: "🙇",
    arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
    transliteration: "Subhana Rabbiyal-A'la",
    translation: "Glory be to my Lord, the Most High",
    detail: "Perform the second prostration exactly like the first. This completes one rakaat. Rise saying Allahu Akbar for the next rakaat.",
  },
  {
    num: 12,
    title: "Tashahhud (At-Tahiyyat)",
    posture: "🧘",
    arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ashhadu an la ilaha illallah wa ashhadu anna Muhammadan 'abduhu wa rasuluh.",
    translation: "All greetings, prayers and goodness are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is none worthy of worship except Allah, and I bear witness that Muhammad is His servant and Messenger.",
    detail: "Recite in the sitting position after 2nd rakaat (and final). Raise right index finger when saying 'Ash-hadu.' In final sitting, follow with Salawat upon the Prophet ﷺ and a closing dua.",
  },
  {
    num: 13,
    title: "Salawat (Durood Ibrahim)",
    posture: "🧘",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ",
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala aali Muhammadin kama sallayta 'ala Ibrahima wa 'ala aali Ibrahim",
    translation: "O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim.",
    detail: "Recite Durood Ibrahim after Tashahhud in the final sitting, followed by a personal dua (e.g., Allahumma inni zalamtu nafsi…).",
  },
  {
    num: 14,
    title: "Tasleem (Ending the Prayer)",
    posture: "👐",
    arabic: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
    transliteration: "As-salamu 'alaykum wa rahmatullah",
    translation: "Peace be upon you and the mercy of Allah",
    detail: "Turn your head to the right and say 'As-salamu 'alaykum wa rahmatullah.' Then turn left and repeat. This ends the prayer. You may then make du'a or dhikr.",
  },
];

const RAKAAT_GUIDE: Record<number, string[]> = {
  2: ["Rakaat 1: Opening → Fatihah → Surah → Ruku → Sujud × 2", "Rakaat 2: Fatihah → Surah → Ruku → Sujud × 2 → Tashahhud → Salawat → Tasleem"],
  3: ["Rakaat 1: Opening → Fatihah → Surah → Ruku → Sujud × 2", "Rakaat 2: Fatihah → Surah → Ruku → Sujud × 2 → Tashahhud (short)", "Rakaat 3: Fatihah only → Ruku → Sujud × 2 → Full Tashahhud → Salawat → Tasleem"],
  4: ["Rakaat 1: Opening → Fatihah → Surah → Ruku → Sujud × 2", "Rakaat 2: Fatihah → Surah → Ruku → Sujud × 2 → Tashahhud (short)", "Rakaat 3: Fatihah only → Ruku → Sujud × 2", "Rakaat 4: Fatihah only → Ruku → Sujud × 2 → Full Tashahhud → Salawat → Tasleem"],
};

type TabType = "overview" | "steps" | "structure";

export default function SalahGuideScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerInfo | null>(null);
  const [tab, setTab] = useState<TabType>("overview");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const s = makeStyles(colors);

  if (selectedPrayer) {
    const structure = RAKAAT_GUIDE[selectedPrayer.rakaat] ?? [];

    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { setSelectedPrayer(null); setTab("overview"); setExpandedStep(null); }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>Salat {selectedPrayer.name}</Text>
            <Text style={[s.titleAr, { color: selectedPrayer.color }]}>صلاة {selectedPrayer.arabic}</Text>
          </View>
          <View style={[s.rakaatBadge, { backgroundColor: selectedPrayer.color + "20" }]}>
            <Text style={[s.rakaatText, { color: selectedPrayer.color }]}>{selectedPrayer.rakaat}R</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={[s.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {(["overview", "steps", "structure"] as TabType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, { borderBottomColor: tab === t ? selectedPrayer.color : "transparent" }]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, { color: tab === t ? selectedPrayer.color : colors.mutedForeground }]}>
                {t === "overview" ? "Overview" : t === "steps" ? "Steps" : "Structure"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          {tab === "overview" && (
            <>
              {/* Prayer hero */}
              <View style={[s.prayerHero, { backgroundColor: selectedPrayer.color + "15", borderColor: selectedPrayer.color + "40" }]}>
                <Text style={[s.prayerHeroAr, { color: selectedPrayer.color }]}>صلاة {selectedPrayer.arabic}</Text>
                <Text style={[s.prayerHeroName, { color: colors.foreground }]}>{selectedPrayer.name} Prayer</Text>
                <Text style={[s.prayerHeroTime, { color: colors.mutedForeground }]}>🕐 {selectedPrayer.time}</Text>
                <Text style={[s.prayerHeroDesc, { color: colors.foreground }]}>{selectedPrayer.description}</Text>
              </View>

              {/* Conditions */}
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>CONDITIONS FOR VALID PRAYER</Text>
              {[
                ["💧", "Tahara", "Be in a state of ritual purity (wudu or ghusl)"],
                ["👘", "Clean Body & Clothes", "Body, clothing and place of prayer must be clean"],
                ["🧭", "Qibla Direction", "Face the Ka'bah in Makkah"],
                ["⏰", "Correct Time", "Pray within the designated time window"],
                ["🤲", "Niyyah", "Have the intention to perform the specific prayer"],
                ["👗", "Awrah Covered", "Men: navel to knee. Women: entire body except face & hands"],
              ].map(([icon, title, desc]) => (
                <View key={title} style={[s.condRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={s.condIcon}>{icon}</Text>
                  <View style={s.condBody}>
                    <Text style={[s.condTitle, { color: colors.foreground }]}>{title}</Text>
                    <Text style={[s.condDesc, { color: colors.mutedForeground }]}>{desc}</Text>
                  </View>
                </View>
              ))}

              {/* Pillars */}
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>PILLARS (ARKAN) — OBLIGATORY ACTS</Text>
              {[
                "Standing (Qiyam) when able",
                "Opening Takbir — Allahu Akbar",
                "Reciting Al-Fatihah in every rakaat",
                "Ruku (bowing)",
                "Rising from Ruku (I'tidal)",
                "Two Sujuds per rakaat",
                "Sitting between the two Sujuds",
                "Final Tashahhud and Tasleem",
                "Tranquility (Tuma'ninah) in every posture",
                "Maintaining correct order of acts",
              ].map((p, i) => (
                <View key={i} style={[s.pillarRow, { borderBottomColor: colors.border }]}>
                  <View style={[s.pillarNum, { backgroundColor: selectedPrayer.color + "20" }]}>
                    <Text style={[s.pillarNumText, { color: selectedPrayer.color }]}>{i + 1}</Text>
                  </View>
                  <Text style={[s.pillarText, { color: colors.foreground }]}>{p}</Text>
                </View>
              ))}
            </>
          )}

          {tab === "steps" && (
            <>
              <View style={[s.stepsNote, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[s.stepsNoteText, { color: colors.primary }]}>Tap each step to expand Arabic text, transliteration and detailed guidance.</Text>
              </View>
              {GENERAL_STEPS.map(step => (
                <TouchableOpacity
                  key={step.num}
                  style={[s.stepCard, {
                    backgroundColor: expandedStep === step.num ? colors.primary + "08" : colors.card,
                    borderColor: expandedStep === step.num ? colors.primary + "60" : colors.border,
                  }]}
                  onPress={() => setExpandedStep(expandedStep === step.num ? null : step.num)}
                  activeOpacity={0.8}
                >
                  <View style={s.stepHeader}>
                    <View style={[s.stepNumBox, { backgroundColor: expandedStep === step.num ? colors.primary : colors.primary + "20" }]}>
                      <Text style={[s.stepNum, { color: expandedStep === step.num ? "#FFF" : colors.primary }]}>{step.num}</Text>
                    </View>
                    <View style={s.stepBody}>
                      <Text style={[s.stepTitle, { color: colors.foreground }]}>{step.posture} {step.title}</Text>
                    </View>
                    <Feather name={expandedStep === step.num ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                  </View>
                  {expandedStep === step.num && (
                    <View style={[s.stepExpanded, { borderTopColor: colors.border }]}>
                      {step.arabic && (
                        <Text style={[s.stepArabic, { color: colors.foreground }]}>{step.arabic}</Text>
                      )}
                      {step.transliteration && (
                        <Text style={[s.stepTranslit, { color: colors.primary }]}>{step.transliteration}</Text>
                      )}
                      {step.translation && (
                        <Text style={[s.stepTrans, { color: colors.mutedForeground, fontStyle: "italic" }]}>"{step.translation}"</Text>
                      )}
                      <Text style={[s.stepDetail, { color: colors.foreground }]}>{step.detail}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {tab === "structure" && (
            <>
              <View style={[s.structureHero, { backgroundColor: selectedPrayer.color + "15", borderColor: selectedPrayer.color + "40" }]}>
                <Text style={[s.structureNum, { color: selectedPrayer.color }]}>{selectedPrayer.rakaat}</Text>
                <Text style={[s.structureLabel, { color: colors.foreground }]}>Rakaat</Text>
              </View>
              {structure.map((line, i) => (
                <View key={i} style={[s.structureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.structureNum2, { backgroundColor: selectedPrayer.color + "20" }]}>
                    <Text style={[s.structureNumText, { color: selectedPrayer.color }]}>{i + 1}</Text>
                  </View>
                  <Text style={[s.structureText, { color: colors.foreground }]}>{line}</Text>
                </View>
              ))}

              {/* Sunnah rakaat */}
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>SUNNAH PRAYERS</Text>
              <View style={[s.sunnahCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {getSunnahInfo(selectedPrayer.id).map((line, i) => (
                  <View key={i} style={[s.sunnahRow, { borderBottomColor: colors.border }]}>
                    <Text style={[s.sunnahEmoji]}>{i === 0 ? "⭐" : "🌟"}</Text>
                    <Text style={[s.sunnahText, { color: colors.foreground }]}>{line}</Text>
                  </View>
                ))}
              </View>

              {/* Dhikr after prayer */}
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>DHIKR AFTER PRAYER</Text>
              {[
                { arabic: "سُبْحَانَ اللَّهِ", translit: "Subhanallah", count: "33×", meaning: "Glory be to Allah" },
                { arabic: "الْحَمْدُ لِلَّهِ", translit: "Alhamdulillah", count: "33×", meaning: "Praise be to Allah" },
                { arabic: "اللَّهُ أَكْبَرُ", translit: "Allahu Akbar", count: "34×", meaning: "Allah is the Greatest" },
              ].map((d) => (
                <View key={d.translit} style={[s.dhikrRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.dhikrCount, { backgroundColor: colors.gold + "20" }]}>
                    <Text style={[s.dhikrCountText, { color: colors.gold }]}>{d.count}</Text>
                  </View>
                  <View style={s.dhikrBody}>
                    <Text style={[s.dhikrAr, { color: colors.foreground }]}>{d.arabic}</Text>
                    <Text style={[s.dhikrTranslit, { color: colors.primary }]}>{d.translit}</Text>
                    <Text style={[s.dhikrMeaning, { color: colors.mutedForeground }]}>{d.meaning}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // Prayer list
  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Salah Guide</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>دليل الصلاة</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Intro */}
        <View style={[s.introCard, { backgroundColor: colors.navy }]}>
          <Text style={s.introIcon}>🕌</Text>
          <Text style={s.introTitle}>5 Daily Prayers</Text>
          <Text style={[s.introSub, { color: "#FFFFFF80" }]}>
            The second pillar of Islam. Select a prayer to see its complete step-by-step guide with Arabic text, transliteration and detailed instructions.
          </Text>
          <Text style={[s.introHadith, { color: colors.gold }]}>
            "الصلاة عماد الدين" — Prayer is the pillar of the religion
          </Text>
        </View>

        {/* 5 Prayers */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>SELECT A PRAYER</Text>
        {PRAYERS.map(prayer => (
          <TouchableOpacity
            key={prayer.id}
            style={[s.prayerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { setSelectedPrayer(prayer); setTab("overview"); }}
            activeOpacity={0.8}
          >
            <View style={[s.prayerColorBar, { backgroundColor: prayer.color }]} />
            <View style={s.prayerCardBody}>
              <View style={s.prayerCardTop}>
                <Text style={[s.prayerCardName, { color: colors.foreground }]}>{prayer.name}</Text>
                <Text style={[s.prayerCardAr, { color: prayer.color }]}>{prayer.arabic}</Text>
              </View>
              <Text style={[s.prayerCardTime, { color: colors.mutedForeground }]}>{prayer.time}</Text>
              <View style={s.prayerCardMeta}>
                <View style={[s.rakaatPill, { backgroundColor: prayer.color + "20" }]}>
                  <Text style={[s.rakaatPillText, { color: prayer.color }]}>{prayer.rakaat} Rakaat (Fardh)</Text>
                </View>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.border} />
          </TouchableOpacity>
        ))}

        {/* Quick Reference */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>PRAYER TIMES QUICK REFERENCE</Text>
        <View style={[s.refCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            ["Fajr", "Dawn until sunrise", "2", "#7C3AED"],
            ["Dhuhr", "After zenith until Asr", "4", "#0891B2"],
            ["Asr", "Afternoon until sunset", "4", "#D97706"],
            ["Maghrib", "After sunset (brief window)", "3", "#DC2626"],
            ["Isha", "Night until dawn", "4", "#1E3A5F"],
          ].map(([name, time, rakaat, color]) => (
            <View key={name} style={[s.refRow, { borderBottomColor: colors.border }]}>
              <View style={[s.refDot, { backgroundColor: color }]} />
              <Text style={[s.refName, { color: colors.foreground }]}>{name}</Text>
              <Text style={[s.refTime, { color: colors.mutedForeground }]}>{time}</Text>
              <View style={[s.refRakaat, { backgroundColor: color + "20" }]}>
                <Text style={[s.refRakaatText, { color }]}>{rakaat}R</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Invalidators */}
        <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>THINGS THAT INVALIDATE PRAYER</Text>
        <View style={[s.invalidCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            "Speaking intentionally",
            "Laughing",
            "Excessive movement",
            "Breaking wudu (passing wind, etc.)",
            "Turning away from Qibla completely",
            "Eating or drinking",
            "Uncovering the awrah intentionally",
          ].map((item, i) => (
            <View key={i} style={[s.invalidRow, { borderBottomColor: colors.border }]}>
              <Feather name="x-circle" size={14} color="#DC2626" />
              <Text style={[s.invalidText, { color: colors.foreground }]}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getSunnahInfo(prayerId: string): string[] {
  const map: Record<string, string[]> = {
    fajr: ["2 Sunnah Mu'akkadah before Fajr — very emphasized", "The Prophet ﷺ never missed the 2 Sunnah of Fajr even when traveling"],
    dhuhr: ["4 Sunnah before Dhuhr + 2 Sunnah after", "Optional: 2 additional Sunnah after"],
    asr: ["4 Sunnah (Ghair Mu'akkadah) before Asr — recommended"],
    maghrib: ["2 Sunnah Mu'akkadah after Maghrib"],
    isha: ["2 Sunnah after Isha + Witr (1 or 3, obligatory by Hanafi opinion)"],
  };
  return map[prayerId] ?? [];
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 18, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 12 },
    rakaatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    rakaatText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    content: { paddingHorizontal: 16, paddingTop: 16 },

    introCard: { borderRadius: 18, padding: 22, alignItems: "center", marginBottom: 16 },
    introIcon: { fontSize: 40, marginBottom: 8 },
    introTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 8 },
    introSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 12 },
    introHadith: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },

    sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 8 },

    prayerCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
    prayerColorBar: { width: 5, alignSelf: "stretch" },
    prayerCardBody: { flex: 1, padding: 14 },
    prayerCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    prayerCardName: { fontSize: 17, fontFamily: "Inter_700Bold" },
    prayerCardAr: { fontSize: 18, fontFamily: "Inter_400Regular" },
    prayerCardTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
    prayerCardMeta: { flexDirection: "row" },
    rakaatPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    rakaatPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    refCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
    refRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
    refDot: { width: 10, height: 10, borderRadius: 5 },
    refName: { width: 70, fontSize: 14, fontFamily: "Inter_600SemiBold" },
    refTime: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
    refRakaat: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    refRakaatText: { fontSize: 11, fontFamily: "Inter_700Bold" },

    invalidCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
    invalidRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
    invalidText: { fontSize: 14, fontFamily: "Inter_400Regular" },

    // Detail view
    tabBar: { flexDirection: "row", borderBottomWidth: 1 },
    tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2 },
    tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },

    prayerHero: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 16 },
    prayerHeroAr: { fontSize: 28, fontFamily: "Inter_400Regular", marginBottom: 4 },
    prayerHeroName: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },
    prayerHeroTime: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
    prayerHeroDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },

    condRow: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
    condIcon: { fontSize: 22 },
    condBody: { flex: 1 },
    condTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    condDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

    pillarRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    pillarNum: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    pillarNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    pillarText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

    stepsNote: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
    stepsNoteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },

    stepCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
    stepHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
    stepNumBox: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    stepNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
    stepBody: { flex: 1 },
    stepTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    stepExpanded: { padding: 14, paddingTop: 12, borderTopWidth: 1, gap: 8 },
    stepArabic: { fontSize: 18, lineHeight: 32, textAlign: "right" },
    stepTranslit: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
    stepTrans: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
    stepDetail: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 4 },

    structureHero: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 16 },
    structureNum: { fontSize: 60, fontFamily: "Inter_700Bold" },
    structureLabel: { fontSize: 18, fontFamily: "Inter_400Regular" },

    structureRow: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 12 },
    structureNum2: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
    structureNumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
    structureText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

    sunnahCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
    sunnahRow: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderBottomWidth: 1, gap: 10 },
    sunnahEmoji: { fontSize: 16 },
    sunnahText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

    dhikrRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8, gap: 12 },
    dhikrCount: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    dhikrCountText: { fontSize: 14, fontFamily: "Inter_700Bold" },
    dhikrBody: { flex: 1 },
    dhikrAr: { fontSize: 18, lineHeight: 30, textAlign: "right" },
    dhikrTranslit: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
    dhikrMeaning: { fontSize: 12, fontFamily: "Inter_400Regular" },
  });
}
