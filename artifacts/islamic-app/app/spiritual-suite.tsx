import React, { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const AWRAD_ITEMS = [
  {
    id: "hizb_bahr",
    title: "حزب البحر الشريف",
    titleEn: "Hizb al-Bahr",
    author: "الإمام العارف أبو الحسن الشاذليؒ",
    benefit: "حفاظت، تسکینِ قلب، اور دفعِ بلیات کے لیے مجرب ورد",
    arabic: "يَا عَلِيُّ يَا عَظِيمُ يَا حَلِيمُ يَا عَلِيمُ، أَنْتَ رَبِّي، وَعِلْمُكَ حَسْبِي، فَنِعْمَ الرَّبُّ رَبِّي، وَنِعْمَ الْحَسْبُ حَسْبِي، تَنْصُرُ مَن تَشَاءُ وَأَنْتَ الْعَزِيزُ الرَّحِيمُ. نَسْأَلُكَ الْعِصْمَةَ فِي الْحَرَكَاتِ وَالسَّكَنَاتِ، وَالْكَلِمَاتِ وَالإِرَادَاتِ.",
    urdu: "اے سب سے بلند! اے بڑی عظمت والے! اے بردبار! اے سب کچھ جاننے والے! آپ ہی میرے رب ہیں اور آپ کا علم ہی میرے لیے کافی ہے۔ تو کتنا اچھا رب میرا رب ہے اور کتنی اچھی کفایت میری کفایت ہے۔ آپ جس کی چاہتے ہیں نصرت فرماتے ہیں۔",
  },
  {
    id: "dalail",
    title: "دلائل الخيرات — درود شریف",
    titleEn: "Dala'il al-Khayrat",
    author: "الإمام سيدي محمد بن سليمان الجزوليؒ",
    benefit: "عشقِ رسول ﷺ کے حصول اور باطنی انوار کی کشائش",
    arabic: "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِ سَيِّدِنَا مُحَمَّدٍ، صَلَاةً تَرْضَاكَ وَتَرْضَاهُ، وَتَرْضَى بِهَا عَنَّا يَا رَبَّ الْعَالَمِينَ. اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ بَحْرِ أَنْوَارِكَ، وَمَعْدِنِ أَسْرَارِكَ.",
    urdu: "اے اللہ! ہمارے آقا و مولیٰ حضرت محمد ﷺ اور ان کی آل پر ایسی رحمت نازل فرما جو آپ کو بھی پسند ہو اور آپ کے حبیب ﷺ کو بھی پسند ہو، اور جس کے وسیلے سے آپ ہم سے راضی ہو جائیں اے رب العالمین!",
  },
  {
    id: "burdah",
    title: "قصيدة البردة المباركة",
    titleEn: "Qasida Burdah",
    author: "الإمام شرف الدين البوصيريؒ",
    benefit: "بیماریوں سے شفا اور حضور ﷺ کی نظرِ عنایت کا وسیلہ",
    arabic: "مَوْلَايَ صَلِّ وَسَلِّمْ دَائِمًا أَبَدًا\nعَلَى حَبِيبِكَ خَيْرِ الْخَلْقِ كُلِّهِمِ\nهُوَ الْحَبِيبُ الَّذِي تُرْجَى شَفَاعَتُهُ\nلِكُلِّ هَوْلٍ مِنَ الأَهْوَالِ مُقْتَحَمِ",
    urdu: "اے میرے مولا! ہمیشہ ہمیشہ درود و سلام بھیج اپنے حبیب ﷺ پر جو تمام مخلوقات میں سب سے برتر ہیں۔ وہ ایسے پیارے محبوب ہیں جن کی شفاعت کی امید کی جاتی ہے، ہر اس ہولناک مصیبت میں جو اچانک نازل ہو۔",
  },
];

export default function SpiritualSuiteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"muhasabah" | "awrad" | "muraqabah">("muhasabah");

  // Muhasabah State
  const [checks, setChecks] = useState<Record<string, boolean>>({
    truthfulness: true,
    guardedTongue: true,
    loweredGaze: true,
    controlledAnger: true,
    humility: true,
    thankfulness: true,
    recitedQuran: true,
    soughtForgiveness: true,
  });
  const [daroodCount, setDaroodCount] = useState(100);
  const [spiritualNotes, setSpiritualNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Muraqabah Timer State
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [timerRunning, setTimerRunning] = useState(false);
  const [remaining, setRemaining] = useState(300);

  useEffect(() => {
    let interval: any;
    if (timerRunning && remaining > 0) {
      interval = setInterval(() => {
        setRemaining((r) => r - 1);
      }, 1000);
    } else if (remaining === 0 && timerRunning) {
      setTimerRunning(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, remaining]);

  const toggleCheck = (key: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateScore = () => {
    const total = Object.values(checks).filter(Boolean).length;
    const base = Math.round((total / 8) * 80);
    const bonus = Math.min(20, Math.round((daroodCount / 100) * 20));
    return Math.min(100, base + bonus);
  };

  useEffect(() => {
    // Load last saved audit from AsyncStorage
    AsyncStorage.getItem("@daily_muhasabah_history").then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.checks) setChecks(parsed.checks);
          if (parsed.daroodCount) setDaroodCount(parsed.daroodCount);
          if (parsed.notes) setSpiritualNotes(parsed.notes);
        } catch {}
      }
    });
  }, []);

  const saveMuhasabah = async () => {
    try {
      setSavedSuccess(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const record = {
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
        checks,
        daroodCount,
        notes: spiritualNotes,
        score: calculateScore(),
      };
      await AsyncStorage.setItem("@daily_muhasabah_history", JSON.stringify(record));
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {}
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>تزکیۂ نفس و سلوک</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>Tazkiyah & Spiritual Suite</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <View style={[s.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("muhasabah")}
          style={[s.tabItem, activeTab === "muhasabah" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[s.tabText, { color: activeTab === "muhasabah" ? colors.primary : colors.mutedForeground }]}>
            محاسبۂ نفس (Audit)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("awrad")}
          style={[s.tabItem, activeTab === "awrad" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[s.tabText, { color: activeTab === "awrad" ? colors.primary : colors.mutedForeground }]}>
            اوراد و معمولات (Awrad)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("muraqabah")}
          style={[s.tabItem, activeTab === "muraqabah" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[s.tabText, { color: activeTab === "muraqabah" ? colors.primary : colors.mutedForeground }]}>
            مراقبہ ٹائمر (Timer)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* 1. MUHASABAH */}
        {activeTab === "muhasabah" && (
          <View style={{ gap: 14 }}>
            {/* Spiritual Score Card */}
            <View style={[s.scoreCard, { backgroundColor: colors.navy }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={{ fontSize: 13, color: colors.gold, fontWeight: "600" }}>امروزہ روحانی جائزہ</Text>
                  <Text style={{ fontSize: 28, color: "#FFF", fontWeight: "700" }}>{calculateScore()}%</Text>
                  <Text style={{ fontSize: 11, color: "#FFFFFFB0" }}>قَدْ أَفْلَحَ مَن زَكَّاهَا — کامیاب وہ جو پاک ہو گیا</Text>
                </View>
                <View style={[s.scoreBadge, { backgroundColor: colors.gold + "20" }]}>
                  <MaterialCommunityIcons name="heart-pulse" size={32} color={colors.gold} />
                </View>
              </View>
            </View>

            {/* Checklist */}
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>باطنی و ظاہری محاسبہ (DAILY AUDIT):</Text>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14, gap: 12 }]}>
              {[
                { key: "truthfulness", label: "سچائی پر قائم رہے (Truthfulness)", sub: "ہر معاملے میں صدق و راستی اختیار کی" },
                { key: "guardedTongue", label: "زبان کی حفاظت (Guarded Tongue)", sub: "غیبت، بدگوئی اور فضول باتوں سے پرہیز کیا" },
                { key: "loweredGaze", label: "نگاہ کی حفاظت (Lowered Gaze)", sub: "ناجائز مناظر اور بدنظری سے آنکھوں کو روکا" },
                { key: "controlledAnger", label: "غصہ پر قابو (Controlled Anger)", sub: "غصے میں حلم و برداشت سے کام لیا" },
                { key: "humility", label: "تکبر و ریا سے اجتناب (Humility)", sub: "خود پسندی، انا اور دکھاوے سے نفس کو بچایا" },
                { key: "thankfulness", label: "شکر گزاری (Gratitude)", sub: "اللہ تعالیٰ کی ہر چھوٹی بڑی نعمت کا شکر ادا کیا" },
                { key: "recitedQuran", label: "تلاوتِ کلام پاک (Recited Quran)", sub: "آج کے دن کچھ نہ کچھ قرآنی تلاوت و غور کیا" },
                { key: "soughtForgiveness", label: "توبہ واستغفار (Istighfar)", sub: "اپنے گناہوں پر اللہ سے ندامت کے ساتھ معافی مانگی" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => toggleCheck(item.key)}
                  style={s.auditRow}
                >
                  <View style={[s.checkbox, { backgroundColor: checks[item.key] ? colors.primary : "transparent", borderColor: colors.border }]}>
                    {checks[item.key] && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.auditLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[s.auditSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Darood Counter */}
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>ہدیۂ درود شریف (SALAWAT):</Text>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 14 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>روزانہ درود شریف کی تعداد:</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>{daroodCount}x</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {[100, 300, 500, 1000].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setDaroodCount(num)}
                    style={[s.daroodBtn, { backgroundColor: daroodCount === num ? colors.primary : colors.muted }]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: daroodCount === num ? "#FFF" : colors.mutedForeground }}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reflection Notes */}
            <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>احوال و کیفیات (REFLECTIONS):</Text>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 12 }]}>
              <TextInput
                placeholder="اپنے باطنی احوال یا کسی کمی کا اعتراف درج کریں..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[s.notesInput, { color: colors.foreground }]}
                value={spiritualNotes}
                onChangeText={setSpiritualNotes}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={saveMuhasabah}
              style={[s.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={s.saveBtnText}>{savedSuccess ? "محاسبہ محفوظ ہو گیا ✓" : "محاسبہ محفوظ کریں (Save Audit)"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. AWRAD */}
        {activeTab === "awrad" && (
          <View style={{ gap: 14 }}>
            {AWRAD_ITEMS.map((item) => (
              <View key={item.id} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16, gap: 10 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{item.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.primary, marginTop: 2 }}>{item.author}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[s.badgeText, { color: colors.primary }]}>{item.titleEn}</Text>
                  </View>
                </View>

                <View style={{ padding: 12, borderRadius: 10, backgroundColor: colors.muted + "30" }}>
                  <Text style={{ fontSize: 16, lineHeight: 28, color: colors.foreground, textAlign: "right", fontFamily: Platform.OS === "ios" ? "Geeza Pro" : "serif" }}>
                    {item.arabic}
                  </Text>
                </View>

                <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "right", lineHeight: 20 }}>
                  {item.urdu}
                </Text>

                <View style={{ padding: 8, borderRadius: 6, backgroundColor: colors.gold + "15" }}>
                  <Text style={{ fontSize: 11, color: colors.gold, fontWeight: "600" }}>فائدہ: {item.benefit}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 3. MURAQABAH TIMER */}
        {activeTab === "muraqabah" && (
          <View style={{ gap: 16 }}>
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 24, alignItems: "center" }]}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground, marginBottom: 8 }}>
                مراقبۂ ذکرِ قلبی و استحضارِ ذاتِ الٰہی
              </Text>

              {/* Time Display */}
              <View style={[s.timerCircle, { borderColor: colors.primary }]}>
                <Text style={[s.timerText, { color: colors.foreground }]}>{formatTime(remaining)}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>
                  {timerRunning ? "ذکر جاری ہے..." : "مراقبہ کیلئے تیار"}
                </Text>
              </View>

              {/* Presets */}
              <View style={{ flexDirection: "row", gap: 10, marginVertical: 20 }}>
                {[300, 600, 900, 1200].map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    disabled={timerRunning}
                    onPress={() => {
                      setTimerSeconds(sec);
                      setRemaining(sec);
                    }}
                    style={[s.timerPresetBtn, { backgroundColor: timerSeconds === sec ? colors.primary : colors.muted }]}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: timerSeconds === sec ? "#FFF" : colors.mutedForeground }}>
                      {sec / 60}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Control Button */}
              <TouchableOpacity
                onPress={() => setTimerRunning(!timerRunning)}
                style={[s.timerControlBtn, { backgroundColor: timerRunning ? "#DC2626" : colors.primary }]}
              >
                <Text style={{ color: "#FFF", fontSize: 15, fontWeight: "700" }}>
                  {timerRunning ? "مراقبہ روکیں (Stop)" : "مراقبہ شروع کریں (Start Muraqabah)"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Instruction Card */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16, gap: 8 }]}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>طریقۂ مراقبہ (Guidelines):</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 18 }}>
                1. باوضو قبلہ رخ ہو کر با ادب بیٹھیں اور آنکھیں بند کر لیں۔{"\n"}
                2. دنیا کے تمام خیالات کو دل سے نکال کر متوجہ الی اللہ ہوں۔{"\n"}
                3. تصور کریں کہ عرشِ الٰہی سے انوار و برکات کا فیض آپ کے دل (قلب) پر نازل ہو رہا ہے اور دل کہہ رہا ہے: 'اللہ، اللہ'۔
              </Text>
            </View>
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

    scoreCard: { borderRadius: 14, padding: 18, marginBottom: 4 },
    scoreBadge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },

    sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: 4 },
    auditRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
    auditLabel: { fontSize: 13, fontWeight: "600" },
    auditSub: { fontSize: 11, marginTop: 1 },

    daroodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
    notesInput: { fontSize: 13, minHeight: 60, textAlignVertical: "top" },

    saveBtn: { paddingVertical: 13, borderRadius: 10, alignItems: "center", marginTop: 4 },
    saveBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: "600" },

    timerCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, alignItems: "center", justifyContent: "center", marginVertical: 10 },
    timerText: { fontSize: 36, fontWeight: "700", fontVariant: ["tabular-nums"] },
    timerPresetBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
    timerControlBtn: { width: "100%", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  });
}
