import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Question {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
}

const ALL_QUESTIONS: Question[] = [
  { category: "Quran", q: "How many Surahs are in the Quran?", options: ["110", "112", "114", "116"], correct: 2, explanation: "The Quran contains 114 Surahs (chapters), from Al-Fatihah to An-Nas." },
  { category: "Quran", q: "Which Surah is known as 'The Heart of the Quran'?", options: ["Al-Fatihah", "Ya-Sin", "Al-Ikhlas", "Al-Baqarah"], correct: 1, explanation: "Surah Ya-Sin (36) is called the heart of the Quran based on the hadith of Prophet ﷺ." },
  { category: "Quran", q: "Which is the longest Surah in the Quran?", options: ["Al-Imran", "An-Nisa", "Al-Baqarah", "Al-Anfal"], correct: 2, explanation: "Al-Baqarah is the longest surah with 286 verses." },
  { category: "Quran", q: "In which Surah is Ayat al-Kursi found?", options: ["Al-Imran", "Al-Baqarah", "An-Nisa", "Al-Maidah"], correct: 1, explanation: "Ayat al-Kursi is verse 255 of Surah Al-Baqarah." },
  { category: "Quran", q: "Which Surah does not begin with Bismillah?", options: ["Al-Anfal", "At-Tawbah", "An-Naml", "Al-Fatihah"], correct: 1, explanation: "Surah At-Tawbah (9) is the only Surah that does not begin with Bismillah." },
  { category: "Five Pillars", q: "What is the first pillar of Islam?", options: ["Salah", "Sawm", "Shahada", "Zakat"], correct: 2, explanation: "The Shahada (testimony of faith) — 'There is no god but Allah, and Muhammad is His messenger' — is the first pillar." },
  { category: "Five Pillars", q: "How many times a day do Muslims pray?", options: ["3", "4", "5", "7"], correct: 2, explanation: "Muslims pray five times daily: Fajr, Dhuhr, Asr, Maghrib, and Isha." },
  { category: "Five Pillars", q: "What is the Zakat rate on most forms of wealth?", options: ["2%", "2.5%", "5%", "10%"], correct: 1, explanation: "Zakat is 2.5% of one's total savings and wealth above the Nisab threshold after one lunar year." },
  { category: "Five Pillars", q: "Which month is Ramadan in the Islamic calendar?", options: ["7th month", "8th month", "9th month", "10th month"], correct: 2, explanation: "Ramadan is the 9th month of the Islamic Hijri calendar, the month of fasting." },
  { category: "Five Pillars", q: "Hajj is obligatory for every Muslim who is:", options: ["Young and healthy", "Financially and physically able", "An Arab Muslim", "A male Muslim"], correct: 1, explanation: "Hajj is obligatory once in a lifetime for every Muslim who is physically and financially able to undertake it." },
  { category: "Prophets", q: "How many prophets are mentioned by name in the Quran?", options: ["15", "20", "25", "30"], correct: 2, explanation: "25 prophets are mentioned by name in the Quran, from Adam (AS) to Muhammad ﷺ." },
  { category: "Prophets", q: "Who was the first prophet of Islam?", options: ["Ibrahim (AS)", "Nuh (AS)", "Adam (AS)", "Musa (AS)"], correct: 2, explanation: "Adam (AS) was the first human being created by Allah and the first prophet." },
  { category: "Prophets", q: "Prophet Muhammad ﷺ was born in:", options: ["Medina", "Jerusalem", "Makkah", "Taif"], correct: 2, explanation: "Prophet Muhammad ﷺ was born in Makkah around 570 CE (Year of the Elephant)." },
  { category: "Prophets", q: "Which prophet built the Kaaba?", options: ["Musa (AS)", "Dawud (AS)", "Ibrahim (AS) and Ismail (AS)", "Sulayman (AS)"], correct: 2, explanation: "Ibrahim (AS) and his son Ismail (AS) rebuilt the Kaaba as the house of worship for Allah." },
  { category: "Prophets", q: "Which prophet was swallowed by a whale?", options: ["Nuh (AS)", "Yunus (AS)", "Musa (AS)", "Yusuf (AS)"], correct: 1, explanation: "Prophet Yunus (AS) was swallowed by a large whale after leaving his people, and made dua from within it." },
  { category: "History", q: "In which year did the Hijrah (migration) take place?", options: ["610 CE", "615 CE", "622 CE", "630 CE"], correct: 2, explanation: "The Hijrah (migration from Makkah to Medina) took place in 622 CE, marking Year 1 of the Islamic calendar." },
  { category: "History", q: "The first mosque built in Islam is:", options: ["Masjid al-Nabawi", "Masjid al-Haram", "Masjid Quba", "Masjid al-Aqsa"], correct: 2, explanation: "Masjid Quba, built by Prophet Muhammad ﷺ upon arriving in Medina during the Hijrah, is the first mosque in Islam." },
  { category: "History", q: "What is the name of the night journey and ascension of the Prophet ﷺ?", options: ["Hijrah", "Isra and Mi'raj", "Ghazwa", "Fathu Makkah"], correct: 1, explanation: "The Isra (night journey from Makkah to Jerusalem) and Mi'raj (ascension to the heavens) happened in one night." },
  { category: "History", q: "The Battle of Badr took place in which Islamic year?", options: ["1 AH", "2 AH", "3 AH", "5 AH"], correct: 1, explanation: "The Battle of Badr, the first major battle, took place in 2 AH (624 CE) during Ramadan." },
  { category: "Fiqh", q: "How many Rak'ahs does the Fajr prayer have?", options: ["1", "2", "3", "4"], correct: 1, explanation: "The Fajr prayer consists of 2 Rak'ahs (units of prayer)." },
  { category: "Fiqh", q: "Which of these breaks the fast during Ramadan?", options: ["Sleeping", "Taking a blood test", "Intentional eating", "Brushing teeth"], correct: 2, explanation: "Intentional eating, drinking, or similar acts break the fast. Involuntary actions or medical tests generally do not." },
  { category: "Fiqh", q: "Wudu (ablution) is broken by:", options: ["Sleeping deeply", "Sweating", "Looking in a mirror", "Laughing outside prayer"], correct: 0, explanation: "Deep sleep breaks wudu as one loses consciousness. Other listed items do not invalidate wudu." },
  { category: "Arabic", q: "What does 'Subhanallah' mean?", options: ["God is Great", "Praise be to God", "Glory be to God", "There is no god but God"], correct: 2, explanation: "Subhanallah (سبحان الله) means 'Glory be to God' — expressing Allah's perfection and freedom from all deficiencies." },
  { category: "Arabic", q: "What does 'Alhamdulillah' mean?", options: ["God is Great", "All praise is due to God", "I seek forgiveness", "In the name of God"], correct: 1, explanation: "Alhamdulillah (الحمد لله) means 'All praise and thanks be to Allah.'" },
  { category: "Arabic", q: "What does 'Insha'Allah' mean?", options: ["As God wills", "God is Great", "God willing", "Peace be upon you"], correct: 2, explanation: "Insha'Allah (إن شاء الله) means 'If God wills it' — expressing that all things happen by the will of Allah." },
];

const CATEGORIES = ["All", "Quran", "Five Pillars", "Prophets", "History", "Fiqh", "Arabic"];

export default function IslamicQuizScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<"category" | "quiz" | "result">("category");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean; selected: number }[]>([]);

  const startQuiz = (cat: string) => {
    setSelectedCategory(cat);
    const pool = cat === "All" ? ALL_QUESTIONS : ALL_QUESTIONS.filter(q => q.category === cat);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrent(0);
    setAnswered(null);
    setScore(0);
    setAnswers([]);
    setStage("quiz");
  };

  const selectAnswer = useCallback((idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    const isCorrect = idx === questions[current].correct;
    if (Platform.OS !== "web") {
      isCorrect ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    if (isCorrect) setScore(s => s + 1);
    setAnswers(prev => [...prev, { correct: isCorrect, selected: idx }]);
  }, [answered, current, questions]);

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setStage("result");
    } else {
      setCurrent(c => c + 1);
      setAnswered(null);
    }
  };

  const s = makeStyles(colors);
  const q = questions[current];
  const finalPct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const getOptionStyle = (idx: number) => {
    if (answered === null) return [s.option, { backgroundColor: colors.card, borderColor: colors.border }];
    if (idx === q?.correct) return [s.option, { backgroundColor: "#16A34A20", borderColor: "#16A34A", borderWidth: 2 }];
    if (idx === answered && idx !== q?.correct) return [s.option, { backgroundColor: "#DC262620", borderColor: "#DC2626", borderWidth: 2 }];
    return [s.option, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.5 }];
  };

  const getOptionTextColor = (idx: number) => {
    if (answered === null) return colors.foreground;
    if (idx === q?.correct) return "#16A34A";
    if (idx === answered && idx !== q?.correct) return "#DC2626";
    return colors.mutedForeground;
  };

  if (stage === "category") {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>Islamic Quiz</Text>
            <Text style={[s.titleAr, { color: colors.gold }]}>اختبار إسلامي</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[s.catHero, { backgroundColor: colors.navy }]}>
            <Text style={s.catHeroEmoji}>🕌</Text>
            <Text style={s.catHeroTitle}>Test Your Islamic Knowledge</Text>
            <Text style={[s.catHeroSub, { color: "#FFFFFF80" }]}>Choose a category and answer 10 questions</Text>
          </View>
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>SELECT CATEGORY</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => {
              const emoji = { All: "📚", Quran: "🕋", "Five Pillars": "☪️", Prophets: "🌙", History: "📖", Fiqh: "⚖️", Arabic: "🔤" }[cat] ?? "📚";
              const count = cat === "All" ? ALL_QUESTIONS.length : ALL_QUESTIONS.filter(q => q.category === cat).length;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => startQuiz(cat)}
                >
                  <Text style={s.catEmoji}>{emoji}</Text>
                  <Text style={[s.catName, { color: colors.foreground }]}>{cat}</Text>
                  <Text style={[s.catCount, { color: colors.mutedForeground }]}>{count} Q's</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (stage === "result") {
    const grade = finalPct >= 80 ? { label: "Excellent!", emoji: "🏆", color: colors.gold } :
      finalPct >= 60 ? { label: "Good!", emoji: "⭐", color: "#0891B2" } :
      finalPct >= 40 ? { label: "Keep Learning", emoji: "📚", color: "#7C3AED" } :
      { label: "Try Again", emoji: "💪", color: "#DC2626" };

    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
          <View style={{ width: 22 }} />
          <Text style={[s.title, { color: colors.foreground }]}>Quiz Results</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[s.resultHero, { backgroundColor: colors.navy }]}>
            <Text style={s.resultEmoji}>{grade.emoji}</Text>
            <Text style={s.resultLabel}>{grade.label}</Text>
            <Text style={[s.resultScore, { color: grade.color }]}>{score}/{questions.length}</Text>
            <Text style={[s.resultPct, { color: "#FFFFFF80" }]}>{finalPct}% correct</Text>
          </View>
          <View style={s.answerList}>
            {questions.map((q_, i) => (
              <View key={i} style={[s.answerItem, { backgroundColor: answers[i]?.correct ? "#16A34A15" : "#DC262615", borderColor: answers[i]?.correct ? "#16A34A40" : "#DC262640" }]}>
                <View style={[s.answerNum, { backgroundColor: answers[i]?.correct ? "#16A34A30" : "#DC262630" }]}>
                  <Text style={[s.answerNumText, { color: answers[i]?.correct ? "#16A34A" : "#DC2626" }]}>{i + 1}</Text>
                </View>
                <View style={s.answerBody}>
                  <Text style={[s.answerQ, { color: colors.foreground }]} numberOfLines={2}>{q_.q}</Text>
                  <Text style={[s.answerA, { color: answers[i]?.correct ? "#16A34A" : "#DC2626" }]}>
                    {answers[i]?.correct ? "✓ " : "✗ "}{q_.options[q_.correct]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => startQuiz(selectedCategory)}>
            <Feather name="refresh-cw" size={18} color="#FFF" />
            <Text style={s.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.homeBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setStage("category")}>
            <Text style={[s.homeBtnText, { color: colors.foreground }]}>Change Category</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => setStage("category")}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.progressPill}>
          {questions.map((_, i) => (
            <View key={i} style={[s.progressPillDot, {
              backgroundColor: i < current ? colors.primary : i === current ? colors.gold : colors.border,
              width: i === current ? 16 : 8,
            }]} />
          ))}
        </View>
        <Text style={[s.scoreText, { color: colors.primary }]}>{score}/{current}</Text>
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[s.catTag, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[s.catTagText, { color: colors.primary }]}>{q?.category} · Question {current + 1} of {questions.length}</Text>
        </View>

        <Text style={[s.questionText, { color: colors.foreground }]}>{q?.q}</Text>

        <View style={s.options}>
          {q?.options.map((opt, idx) => (
            <TouchableOpacity key={idx} style={getOptionStyle(idx)} onPress={() => selectAnswer(idx)}>
              <View style={[s.optionLetter, {
                backgroundColor: answered !== null && idx === q.correct ? "#16A34A30" :
                  answered !== null && idx === answered && idx !== q.correct ? "#DC262630" :
                  colors.primary + "15",
              }]}>
                <Text style={[s.optionLetterText, { color: getOptionTextColor(idx) }]}>{["A", "B", "C", "D"][idx]}</Text>
              </View>
              <Text style={[s.optionText, { color: getOptionTextColor(idx) }]}>{opt}</Text>
              {answered !== null && idx === q.correct && <Feather name="check-circle" size={18} color="#16A34A" />}
              {answered !== null && idx === answered && idx !== q.correct && <Feather name="x-circle" size={18} color="#DC2626" />}
            </TouchableOpacity>
          ))}
        </View>

        {answered !== null && (
          <View style={[s.explanation, { backgroundColor: colors.card, borderColor: colors.primary + "30", borderLeftColor: colors.primary }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[s.explanationText, { color: colors.foreground }]}>{q?.explanation}</Text>
          </View>
        )}

        {answered !== null && (
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: colors.primary }]} onPress={nextQuestion}>
            <Text style={s.nextBtnText}>{current + 1 >= questions.length ? "See Results" : "Next Question"}</Text>
            <Feather name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    content: { paddingHorizontal: 16, paddingTop: 8 },
    sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 10 },
    catHero: { borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 20 },
    catHeroEmoji: { fontSize: 48, marginBottom: 8 },
    catHeroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF", textAlign: "center", marginBottom: 6 },
    catHeroSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    catCard: { width: "47%", borderRadius: 16, padding: 16, alignItems: "center", gap: 6, borderWidth: 1 },
    catEmoji: { fontSize: 32, marginBottom: 4 },
    catName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    catCount: { fontSize: 12, fontFamily: "Inter_400Regular" },

    progressPill: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 },
    progressPillDot: { height: 8, borderRadius: 4 },
    scoreText: { fontSize: 15, fontFamily: "Inter_700Bold" },

    catTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, alignSelf: "flex-start", marginBottom: 16 },
    catTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    questionText: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 30, marginBottom: 24 },
    options: { gap: 10 },
    option: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
    optionLetter: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    optionLetterText: { fontSize: 14, fontFamily: "Inter_700Bold" },
    optionText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },

    explanation: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 14, marginTop: 16, alignItems: "flex-start" },
    explanationText: { flex: 1, fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
    nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16, marginTop: 16 },
    nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },

    resultHero: { borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 20 },
    resultEmoji: { fontSize: 56, marginBottom: 8 },
    resultLabel: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 4 },
    resultScore: { fontSize: 48, fontFamily: "Inter_700Bold", marginBottom: 4 },
    resultPct: { fontSize: 15, fontFamily: "Inter_400Regular" },
    answerList: { gap: 8, marginBottom: 16 },
    answerItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
    answerNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    answerNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    answerBody: { flex: 1 },
    answerQ: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
    answerA: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    retryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16, marginBottom: 10 },
    retryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
    homeBtn: { alignItems: "center", borderRadius: 14, paddingVertical: 14, borderWidth: 1 },
    homeBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  });
}
