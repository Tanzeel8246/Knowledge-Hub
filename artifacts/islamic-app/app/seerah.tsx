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

interface SeerahPhase {
  id: string;
  title: string;
  titleAr: string;
  period: string;
  color: string;
  icon: string;
  summary: string;
  events: SeerahEvent[];
}

interface SeerahEvent {
  year: string;
  title: string;
  titleAr?: string;
  description: string;
  lesson?: string;
}

const PHASES: SeerahPhase[] = [
  {
    id: "birth", title: "Before Prophethood", titleAr: "ما قبل النبوة", period: "570–609 CE", color: "#78716C", icon: "🌙",
    summary: "The life of Muhammad ﷺ before he received revelation — his noble character, early life, and divine preparation.",
    events: [
      { year: "570 CE", title: "Birth in Makkah", titleAr: "الولادة في مكة", description: "Born on 12 Rabi' al-Awwal (Year of the Elephant) in Banu Hashim quarter. His father Abdullah had died before his birth. He was entrusted to Halimah al-Sa'diyyah for nursing in the desert.", lesson: "Allah prepares His greatest servants through early trials — orphanhood shaped the Prophet's ﷺ compassion." },
      { year: "576 CE", title: "Death of Aminah (Mother)", description: "His mother Aminah died at Abwa when he was just 6 years old. He was then raised by his grandfather Abdul Muttalib." },
      { year: "578 CE", title: "Death of Abdul Muttalib", description: "His grandfather and protector Abdul Muttalib died when the Prophet ﷺ was 8 years old. His uncle Abu Talib then became his guardian." },
      { year: "582 CE", title: "First Journey to Syria", description: "Traveled with his uncle Abu Talib. The Christian monk Bahira recognized signs of prophethood and warned Abu Talib to protect him." },
      { year: "590 CE", title: "Harb al-Fijar (Sacrilegious War)", description: "Participated in collecting and passing arrows — not direct fighting — during this war between the tribes, which violated the sacred months." },
      { year: "594 CE", title: "Hilf al-Fudul (Pact of the Virtuous)", description: "A pact to protect the oppressed. The Prophet ﷺ later said: 'I was present at a pact in Abdullah ibn Jud'an's house that I would not exchange for red camels.'" },
      { year: "595 CE", title: "Marriage to Khadijah RA", titleAr: "الزواج من خديجة", description: "At 25, married the noble businesswoman Khadijah bint Khuwaylid (RA), 15 years his senior. She trusted his character (Al-Amin) and proposed through an intermediary.", lesson: "The most beloved person to the Prophet ﷺ was Khadijah RA — she was his anchor of support for 25 years." },
      { year: "605 CE", title: "Rebuilding of Ka'bah — The Black Stone", description: "When Quraysh rebuilt the Ka'bah and disputed who would place the Black Stone, the Prophet ﷺ used his cloak to allow all tribes to lift it together — solving the crisis at 35.", lesson: "His wisdom resolved a tribal conflict that could have led to bloodshed — earned him the title Al-Amin (the Trustworthy)." },
    ],
  },
  {
    id: "meccan", title: "Early Meccan Period", titleAr: "العهد المكي الأول", period: "610–615 CE", color: "#7C3AED", icon: "📖",
    summary: "The first 5 years of prophethood — secret call to Islam, first Muslims, early persecution, and the foundation of faith.",
    events: [
      { year: "610 CE", title: "First Revelation in Cave Hira", titleAr: "نزول الوحي في غار حراء", description: "During Ramadan, Angel Jibreel (AS) appeared and commanded 'Iqra!' (Read!). The first 5 verses of Surah Al-Alaq were revealed. The Prophet ﷺ returned trembling to Khadijah RA who consoled him.", lesson: "The first word revealed was 'Iqra' (Read/Recite) — Islam began with an emphasis on knowledge." },
      { year: "610 CE", title: "First Muslims", description: "Khadijah RA (wife) — first Muslim. Ali ibn Abi Talib (RA) — first youth. Abu Bakr As-Siddiq (RA) — first adult male outside the household. Zayd ibn Harithah (RA) — first freed slave." },
      { year: "613 CE", title: "Public Call to Islam", titleAr: "الدعوة العلنية", description: "After 3 years of private dawah, Allah revealed: 'So proclaim openly what you have been commanded.' (Al-Hijr: 94). The Prophet ﷺ called from Mount Safa — Quraysh began persecution.", lesson: "When commanded to go public with truth, the Prophet ﷺ did so immediately despite knowing the consequences." },
      { year: "614 CE", title: "Persecution Intensifies", description: "Quraysh tortured poor Muslims: Bilal ibn Rabah (RA) was dragged on burning sand; Sumayyah RA and her husband Yasir were martyred — the first martyrs in Islam.", lesson: "Sumayyah RA — a female slave — was the first martyr of Islam. Spiritual status has nothing to do with social status." },
    ],
  },
  {
    id: "meccan2", title: "Middle & Later Meccan Period", titleAr: "العهد المكي المتأخر", period: "615–622 CE", color: "#D97706", icon: "⚡",
    summary: "Hijrah to Abyssinia, the social boycott, Year of Sorrow, Isra wal Mi'raj, and preparations for Hijrah.",
    events: [
      { year: "615 CE", title: "Hijrah to Abyssinia", titleAr: "الهجرة إلى الحبشة", description: "~15 Muslims emigrated to Abyssinia under the just Christian king Negus (Ashama). Ja'far ibn Abi Talib recited Surah Maryam before the king, who wept and said 'By God, Jesus was not beyond what you described.'" },
      { year: "616–619 CE", title: "Social Boycott of Banu Hashim", description: "Quraysh imposed a complete economic and social boycott on Banu Hashim. Muslims survived on leaves and tree bark for 3 years in the Valley of Abu Talib. The boycott document was eventually found eaten by termites — a sign." },
      { year: "619 CE", title: "Year of Sorrow (Aam al-Huzn)", titleAr: "عام الحزن", description: "Khadijah RA (wife) and Abu Talib (uncle/protector) both died in the same year. The Prophet ﷺ attempted to seek support from Ta'if — was mocked, stoned, and rejected. He prayed the famous dua of Ta'if.", lesson: "The dua of Ta'if: 'O Allah, to You I complain of my weakness... if You are not angry with me, I do not care.' — perfect trust in Allah during humiliation." },
      { year: "620 CE", title: "Isra wal Mi'raj", titleAr: "الإسراء والمعراج", description: "Night Journey from Al-Masjid al-Haram to Al-Masjid al-Aqsa, then ascending through 7 heavens. Met previous prophets. 5 daily prayers were prescribed (reduced from 50 by intercession of Musa AS).", lesson: "The gift of Salah was given directly to the Prophet ﷺ in the heavens — it is the most direct link between the believer and Allah." },
      { year: "621–622 CE", title: "Pledges of Aqabah", titleAr: "بيعة العقبة", description: "First Pledge: 12 men from Madinah pledged Islam. Second Pledge: 75 people (including 2 women) pledged to protect the Prophet ﷺ as they protect their own families — paving the way for Hijrah." },
    ],
  },
  {
    id: "medinan", title: "Early Medinan Period", titleAr: "العهد المدني الأول", period: "622–627 CE", color: "#16A34A", icon: "🕌",
    summary: "The Great Hijrah, establishment of the Islamic state, Constitution of Madinah, and the first major battles.",
    events: [
      { year: "622 CE / 1 AH", title: "The Great Hijrah", titleAr: "الهجرة الكبرى", description: "The Prophet ﷺ and Abu Bakr (RA) hid in Cave Thawr for 3 days with the Quraysh pursuing. They miraculously escaped — a spider's web and dove's nest blocked the cave entrance. Arrived in Quba, establishing the first mosque in Islam.", lesson: "The Islamic calendar begins with Hijrah — showing that community, migration for faith, and sacrifice are foundational to Islam." },
      { year: "622 CE / 1 AH", title: "Constitution of Madinah", description: "The Prophet ﷺ drafted the world's first written constitution — defining rights and responsibilities of all communities: Muslims, Jews, and polytheists of Madinah. Established freedom of religion and mutual defense." },
      { year: "624 CE / 2 AH", title: "Battle of Badr", titleAr: "غزوة بدر", description: "313 poorly-armed Muslims vs 1,000+ Qurayshi soldiers. Allah sent 1,000 angels to assist. 70 Qurayshi leaders killed. The Prophet ﷺ wept in prayer all night before the battle.", lesson: "Badr is the criterion (Furqan) — showing that divine support comes to those who are truthful and obedient, regardless of numbers." },
      { year: "625 CE / 3 AH", title: "Battle of Uhud", titleAr: "غزوة أحد", description: "Initial victory turned to setback when archers left their position. 70 companions martyred including Hamzah RA (the Prophet's ﷺ uncle). The Prophet ﷺ was injured. Allah revealed 60+ verses analyzing lessons from Uhud.", lesson: "Uhud's lesson: disobedience to the Prophet ﷺ has consequences. Trials are tests of faith, not signs of abandonment." },
      { year: "627 CE / 5 AH", title: "Battle of Khandaq (Trench)", titleAr: "غزوة الأحزاب", description: "10,000 confederates besieged Madinah. On Salman al-Farisi's (RA) suggestion, a trench was dug. After ~27 days, Allah sent a fierce storm. The confederates retreated in disarray.", lesson: "Strategic thinking is part of Islamic wisdom — Salman RA brought Persian innovation to Islamic warfare." },
    ],
  },
  {
    id: "medinan2", title: "Later Medinan Period", titleAr: "العهد المدني المتأخر", period: "627–632 CE", color: "#0891B2", icon: "🌟",
    summary: "Treaty of Hudaybiyyah, Conquest of Makkah, Farewell Pilgrimage, and the completion of the divine message.",
    events: [
      { year: "628 CE / 6 AH", title: "Treaty of Hudaybiyyah", titleAr: "صلح الحديبية", description: "The Prophet ﷺ set out for Umrah but Quraysh blocked them at Hudaybiyyah. A 10-year peace treaty was signed on apparently unfavorable terms. Allah called it 'a clear victory' (Fath Mubeen). Massive conversions followed.", lesson: "Strategic patience and long-term vision over short-term pride — the Prophet's ﷺ wisdom saw what others couldn't." },
      { year: "628 CE / 7 AH", title: "Letters to Kings", description: "The Prophet ﷺ sent letters to major world leaders: Emperor Heraclius of Rome, Chosroes of Persia, Negus of Abyssinia, Muqawqis of Egypt — inviting them to Islam. Heraclius acknowledged his prophethood privately." },
      { year: "629 CE / 7 AH", title: "Battle of Khaybar", description: "Conquest of the Jewish fortress of Khaybar. Ali ibn Abi Talib (RA) carried the flag and conquered it after the Prophet ﷺ said: 'Tomorrow I will give the flag to one who loves Allah and His messenger, and Allah and His messenger love him.'" },
      { year: "629 CE / 8 AH", title: "First Umrah (Umrah al-Qada)", description: "Muslims performed Umrah under the treaty — 3 days in Makkah. The Prophet ﷺ married Maymunah RA and left peacefully as agreed, demonstrating Islamic discipline." },
      { year: "630 CE / 8 AH", title: "Conquest of Makkah", titleAr: "فتح مكة", description: "Quraysh violated the treaty. 10,000 Muslims marched. Makkah surrendered peacefully. The Prophet ﷺ entered Makkah and declared: 'No blame will there be upon you today.' General amnesty was granted. 360 idols in Ka'bah were destroyed.", lesson: "The greatest victory of the Prophet ﷺ was marked by forgiveness, not revenge — the highest Islamic virtue." },
      { year: "632 CE / 10 AH", title: "Farewell Pilgrimage", titleAr: "حجة الوداع", description: "The Prophet ﷺ performed his one and only Hajj with ~100,000 companions. On Arafat he declared: 'I have left among you two things: the Book of Allah and my Sunnah. You will never go astray as long as you hold fast to them.'" },
      { year: "632 CE / 11 AH", title: "Death of the Prophet ﷺ", titleAr: "وفاة النبي ﷺ", description: "On 12 Rabi' al-Awwal, the Prophet ﷺ passed away at 63 years of age in the apartment of Aisha RA in Madinah, his head resting in her lap. Abu Bakr (RA) told the people: 'Whoever worshipped Muhammad, Muhammad has died. Whoever worships Allah, Allah is ever-Living and will never die.'", lesson: "Islam does not end with the Prophet ﷺ — it was completed and preserved for all humanity until the Day of Judgment." },
    ],
  },
];

export default function SeerahScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedPhase, setSelectedPhase] = useState<SeerahPhase | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{ phase: SeerahPhase; event: SeerahEvent } | null>(null);

  const s = makeStyles(colors);

  if (selectedEvent) {
    const { phase, event } = selectedEvent;
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedEvent(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>{event.year}</Text>
            <Text style={[s.titleSub, { color: phase.color }]}>{phase.title}</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[s.eventHero, { backgroundColor: phase.color + "15", borderColor: phase.color + "40" }]}>
            <Text style={[s.eventHeroYear, { color: phase.color }]}>{event.year}</Text>
            <Text style={[s.eventHeroTitle, { color: colors.foreground }]}>{event.title}</Text>
            {event.titleAr && <Text style={[s.eventHeroAr, { color: colors.gold }]}>{event.titleAr}</Text>}
          </View>
          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <View style={[s.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.descText, { color: colors.foreground }]}>{event.description}</Text>
          </View>
          {event.lesson && (
            <>
              <Text style={[s.secLabel, { color: colors.mutedForeground }]}>LESSON & WISDOM</Text>
              <View style={[s.lessonCard, { backgroundColor: colors.gold + "10", borderColor: colors.gold + "40" }]}>
                <Text style={[s.lessonIcon, {}]}>💡</Text>
                <Text style={[s.lessonText, { color: colors.foreground }]}>{event.lesson}</Text>
              </View>
            </>
          )}
          <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelectedEvent(null)}>
            <Feather name="arrow-left" size={16} color={colors.foreground} />
            <Text style={[s.backBtnText, { color: colors.foreground }]}>Back to {phase.title}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (selectedPhase) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedPhase(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>{selectedPhase.title}</Text>
            <Text style={[s.titleAr, { color: colors.gold }]}>{selectedPhase.titleAr}</Text>
          </View>
          <Text style={[s.periodText, { color: selectedPhase.color }]}>{selectedPhase.period}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.phaseContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[s.phaseSummary, { backgroundColor: selectedPhase.color + "12", borderColor: selectedPhase.color + "40" }]}>
            <Text style={s.phaseSummaryIcon}>{selectedPhase.icon}</Text>
            <Text style={[s.phaseSummaryText, { color: colors.foreground }]}>{selectedPhase.summary}</Text>
          </View>
          {selectedPhase.events.map((event, i) => (
            <TouchableOpacity key={i} style={s.eventRow} onPress={() => setSelectedEvent({ phase: selectedPhase, event })} activeOpacity={0.8}>
              <View style={s.timelineLeft}>
                <View style={[s.timelineDot, { backgroundColor: selectedPhase.color }]} />
                {i < selectedPhase.events.length - 1 && <View style={[s.timelineLine, { backgroundColor: selectedPhase.color + "40" }]} />}
              </View>
              <View style={[s.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.eventYear, { color: selectedPhase.color }]}>{event.year}</Text>
                <Text style={[s.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
                {event.titleAr && <Text style={[s.eventAr, { color: colors.gold }]}>{event.titleAr}</Text>}
                <Text style={[s.eventPreview, { color: colors.mutedForeground }]} numberOfLines={2}>{event.description}</Text>
                {event.lesson && (
                  <View style={[s.lessonChip, { backgroundColor: colors.gold + "15" }]}>
                    <Text style={[s.lessonChipText, { color: "#D97706" }]}>💡 Has lesson</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
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
          <Text style={[s.title, { color: colors.foreground }]}>Seerah</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>السِّيرَة النَّبَوِيَّة</Text>
        </View>
      </View>

      <View style={[s.introBanner, { backgroundColor: colors.navy }]}>
        <Text style={s.introBannerText}>The Biography of Prophet Muhammad ﷺ — the best of creation, mercy to all worlds.</Text>
        <Text style={[s.introBannerAr, { color: colors.gold }]}>وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}>
        {PHASES.map((phase, index) => (
          <TouchableOpacity key={phase.id} style={[s.phaseCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: phase.color, borderLeftWidth: 4 }]} onPress={() => setSelectedPhase(phase)} activeOpacity={0.8}>
            <View style={s.phaseCardLeft}>
              <Text style={s.phaseIcon}>{phase.icon}</Text>
              <View style={[s.phaseNum, { backgroundColor: phase.color + "20" }]}>
                <Text style={[s.phaseNumText, { color: phase.color }]}>{index + 1}</Text>
              </View>
            </View>
            <View style={s.phaseCardBody}>
              <Text style={[s.phaseTitle, { color: colors.foreground }]}>{phase.title}</Text>
              <Text style={[s.phaseTitleAr, { color: colors.gold }]}>{phase.titleAr}</Text>
              <Text style={[s.phasePeriod, { color: phase.color }]}>{phase.period}</Text>
              <Text style={[s.phaseSummaryShort, { color: colors.mutedForeground }]} numberOfLines={2}>{phase.summary}</Text>
              <View style={[s.phaseEventCount, { backgroundColor: phase.color + "15" }]}>
                <Text style={[s.phaseEventCountText, { color: phase.color }]}>{phase.events.length} events</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.border} />
          </TouchableOpacity>
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
    titleSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
    periodText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

    introBanner: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 14, marginBottom: 4 },
    introBannerText: { color: "#FFFFFFC0", fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 8 },
    introBannerAr: { fontSize: 15, textAlign: "right", lineHeight: 28 },

    listContent: { paddingHorizontal: 16, paddingTop: 12 },
    phaseCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 12 },
    phaseCardLeft: { alignItems: "center", gap: 6 },
    phaseIcon: { fontSize: 20 },
    phaseNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    phaseNumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
    phaseCardBody: { flex: 1 },
    phaseTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 2 },
    phaseTitleAr: { fontSize: 12, marginBottom: 2 },
    phasePeriod: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
    phaseSummaryShort: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 6 },
    phaseEventCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
    phaseEventCountText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

    // Phase detail
    phaseContent: { paddingHorizontal: 16, paddingTop: 12 },
    phaseSummary: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
    phaseSummaryIcon: { fontSize: 22 },
    phaseSummaryText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 22 },

    eventRow: { flexDirection: "row", marginBottom: 12, gap: 12 },
    timelineLeft: { width: 14, alignItems: "center" },
    timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 16 },
    timelineLine: { width: 2, flex: 1, marginTop: 4 },
    eventCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12 },
    eventYear: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 4 },
    eventTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 3 },
    eventAr: { fontSize: 13, marginBottom: 6 },
    eventPreview: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 6 },
    lessonChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
    lessonChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

    // Event detail
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },
    eventHero: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
    eventHeroYear: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 6 },
    eventHeroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 28, marginBottom: 8 },
    eventHeroAr: { fontSize: 18, lineHeight: 30 },
    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 6 },
    descCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
    descText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 24 },
    lessonCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
    lessonIcon: { fontSize: 16 },
    lessonText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 14, justifyContent: "center" },
    backBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
