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

type Era = "pre-islamic" | "prophetic" | "khilafah" | "umayyad" | "abbasid" | "ottoman" | "modern";

interface HistoryEvent {
  id: string;
  year: string; // e.g. "570 CE" or "1 AH"
  yearNum: number; // for sorting (CE year)
  title: string;
  arabic?: string;
  description: string;
  significance: string;
  era: Era;
  category: "prophecy" | "battle" | "revelation" | "political" | "scholarship" | "architecture" | "person";
}

const ERA_CONFIG: Record<Era, { label: string; color: string; icon: string }> = {
  "pre-islamic": { label: "Pre-Islamic", color: "#78716C", icon: "⚱️" },
  "prophetic": { label: "Prophetic Era", color: "#16A34A", icon: "🌙" },
  "khilafah": { label: "Rightly Guided Caliphs", color: "#0891B2", icon: "📜" },
  "umayyad": { label: "Umayyad Caliphate", color: "#7C3AED", icon: "🏛️" },
  "abbasid": { label: "Abbasid Caliphate", color: "#D97706", icon: "📚" },
  "ottoman": { label: "Ottoman Empire", color: "#DC2626", icon: "⚔️" },
  "modern": { label: "Modern Era", color: "#059669", icon: "🌍" },
};

const CAT_CONFIG: Record<string, { label: string; color: string }> = {
  prophecy: { label: "Prophecy", color: "#16A34A" },
  battle: { label: "Battle", color: "#DC2626" },
  revelation: { label: "Revelation", color: "#7C3AED" },
  political: { label: "Political", color: "#0891B2" },
  scholarship: { label: "Scholarship", color: "#D97706" },
  architecture: { label: "Architecture", color: "#059669" },
  person: { label: "Person", color: "#6366F1" },
};

const EVENTS: HistoryEvent[] = [
  // Pre-Islamic
  { id: "e01", year: "570 CE", yearNum: 570, title: "Year of the Elephant — Birth of Prophet ﷺ", arabic: "عام الفيل", description: "The army of Abraha with elephants marched on Makkah to destroy the Ka'bah. Allah destroyed them with birds carrying stones (Surah Al-Fil). In the same year, the Prophet Muhammad ﷺ was born in Makkah on 12 Rabi' al-Awwal.", significance: "The miraculous destruction of Abraha's army and the birth of the Seal of Prophets.", era: "pre-islamic", category: "prophecy" },
  { id: "e02", year: "595 CE", yearNum: 595, title: "Marriage of the Prophet ﷺ to Khadijah RA", arabic: "زواج النبي ﷺ من خديجة", description: "At age 25, the Prophet ﷺ married Khadijah bint Khuwaylid (RA), a respected businesswoman 15 years his senior. She was the first person to accept Islam and supported the Prophet ﷺ throughout the early years of his mission.", significance: "Khadijah RA was the first Muslim and a pillar of support for the Prophet ﷺ.", era: "pre-islamic", category: "person" },

  // Prophetic Era
  { id: "e03", year: "610 CE", yearNum: 610, title: "First Revelation — Cave of Hira", arabic: "أول الوحي — غار حراء", description: "At age 40, during the month of Ramadan, Angel Jibreel (AS) appeared to the Prophet ﷺ in the Cave of Hira with the first 5 verses of Surah Al-Alaq: 'Iqra' bismi Rabbika...' This marked the beginning of prophethood.", significance: "The beginning of the Quran's revelation — the most pivotal moment in Islamic history.", era: "prophetic", category: "revelation" },
  { id: "e04", year: "613 CE", yearNum: 613, title: "Public Proclamation of Islam", arabic: "الدعوة العلنية", description: "After 3 years of secret preaching, the Prophet ﷺ began publicly calling people to Islam at Mount Safa. The Quraysh responded with persecution and boycotts against the Muslims.", significance: "Islam moved from private dawah to public declaration.", era: "prophetic", category: "prophecy" },
  { id: "e05", year: "615 CE", yearNum: 615, title: "First Hijrah to Abyssinia", arabic: "الهجرة الأولى إلى الحبشة", description: "Facing Qurayshi persecution, the Prophet ﷺ advised ~15 Muslims to emigrate to Abyssinia (Ethiopia), ruled by the just Christian king Negus (Ashama ibn Abjar). This was the first migration in Islamic history.", significance: "The first Muslim diaspora — seeking justice under a non-Muslim ruler.", era: "prophetic", category: "political" },
  { id: "e06", year: "619 CE", yearNum: 619, title: "Year of Sorrow — Death of Khadijah RA & Abu Talib", arabic: "عام الحزن", description: "In one year, the Prophet ﷺ lost his beloved wife Khadijah RA and his protecting uncle Abu Talib. This left him vulnerable to Qurayshi attacks. The Prophet ﷺ called it 'The Year of Sorrow.'", significance: "Deep personal and political loss that tested the Prophet's ﷺ resolve.", era: "prophetic", category: "person" },
  { id: "e07", year: "620 CE", yearNum: 620, title: "Isra wal Mi'raj — Night Journey", arabic: "الإسراء والمعراج", description: "Allah took the Prophet ﷺ on the Night Journey from Masjid al-Haram to Masjid al-Aqsa (Isra), then ascending through the heavens (Mi'raj). He met previous prophets and received the command of 5 daily prayers (reduced from 50).", significance: "The 5 daily prayers were made obligatory — the second pillar of Islam.", era: "prophetic", category: "prophecy" },
  { id: "e08", year: "622 CE", yearNum: 622, title: "The Great Hijrah to Madinah", arabic: "الهجرة إلى المدينة", description: "The Prophet ﷺ and the Muslims emigrated from Makkah to Yathrib (renamed Madinah). This marks Year 1 AH of the Islamic calendar. The Prophet ﷺ established the first Islamic state and the Constitution of Madinah.", significance: "The foundational event of the Islamic state. Islamic calendar begins here.", era: "prophetic", category: "political" },
  { id: "e09", year: "624 CE / 2 AH", yearNum: 624, title: "Battle of Badr — First Major Victory", arabic: "غزوة بدر الكبرى", description: "The first major battle of Islam. 313 poorly-armed Muslims defeated over 1,000 Qurayshi soldiers. 70 Quraysh were killed and 70 captured. Angels fought alongside the Muslims according to the Quran (Surah Al-Anfal).", significance: "A miraculous victory that established the Muslim community as a serious political force.", era: "prophetic", category: "battle" },
  { id: "e10", year: "625 CE / 3 AH", yearNum: 625, title: "Battle of Uhud", arabic: "غزوة أحد", description: "The Muslims initially had the upper hand but a group of archers left their positions against orders. The Quraysh turned the battle and the Muslims suffered losses including 70 martyrs. The Prophet ﷺ himself was injured.", significance: "A profound lesson in obedience and discipline for the Muslim community.", era: "prophetic", category: "battle" },
  { id: "e11", year: "627 CE / 5 AH", yearNum: 627, title: "Battle of the Trench (Khandaq)", arabic: "غزوة الأحزاب — الخندق", description: "10,000 confederate forces besieged Madinah. On the suggestion of Salman al-Farisi (RA), a trench was dug around Madinah. After weeks, Allah sent a fierce storm and fear into the hearts of the confederates, who retreated.", significance: "Demonstrated the power of strategic thinking and divine aid.", era: "prophetic", category: "battle" },
  { id: "e12", year: "628 CE / 6 AH", yearNum: 628, title: "Treaty of Hudaybiyyah", arabic: "صلح الحديبية", description: "The Prophet ﷺ and Quraysh signed a 10-year peace treaty. Though seemingly unfavorable, the Quran called it 'a clear victory' (Fath Mubeen). It allowed peaceful preaching and led to massive conversion.", significance: "Called 'a clear victory' — the wisdom of strategic diplomacy over armed conflict.", era: "prophetic", category: "political" },
  { id: "e13", year: "630 CE / 8 AH", yearNum: 630, title: "Conquest of Makkah", arabic: "فتح مكة", description: "After Quraysh violated the Treaty of Hudaybiyyah, the Prophet ﷺ marched with 10,000 Muslims. Makkah surrendered peacefully. The Prophet ﷺ declared a general amnesty and purified the Ka'bah of 360 idols.", significance: "The peaceful conquest that transformed the heart of Arabia without major bloodshed.", era: "prophetic", category: "battle" },
  { id: "e14", year: "632 CE / 10 AH", yearNum: 632, title: "Farewell Pilgrimage & Death of the Prophet ﷺ", arabic: "حجة الوداع — وفاة النبي ﷺ", description: "The Prophet ﷺ performed his only Hajj and delivered the Farewell Sermon on Mount Arafat, declaring: 'I have left among you the Quran and my Sunnah.' Shortly after returning to Madinah, the Prophet ﷺ passed away at age 63.", significance: "The completion of the Islamic message and the end of prophethood.", era: "prophetic", category: "person" },

  // Khilafah
  { id: "e15", year: "632–634 CE / 11–13 AH", yearNum: 632, title: "Khilafah of Abu Bakr As-Siddiq RA", arabic: "خلافة أبي بكر الصديق", description: "The first caliph preserved Islamic unity after the Prophet's death, suppressed the Ridda (apostasy) wars, and initiated the compilation of the Quran. Umar ibn al-Khattab nominated him as the community's leader.", significance: "Preserved the unity of the Ummah at its most vulnerable moment.", era: "khilafah", category: "political" },
  { id: "e16", year: "636 CE / 15 AH", yearNum: 636, title: "Battle of al-Qadisiyyah — Conquest of Persia", arabic: "معركة القادسية", description: "The Muslim army under Sa'd ibn Abi Waqqas (RA) defeated the mighty Sassanid Persian Empire in a decisive 3-day battle. This opened the path to the conquest of Iraq and Persia.", significance: "The fall of the Sassanid Empire — one of the two superpowers of the ancient world.", era: "khilafah", category: "battle" },
  { id: "e17", year: "637 CE / 16 AH", yearNum: 637, title: "Conquest of Jerusalem", arabic: "فتح بيت المقدس", description: "Caliph Umar ibn al-Khattab (RA) personally traveled to Jerusalem to receive its keys from Patriarch Sophronius. He issued the Covenant of Umar guaranteeing protection of Christian and Jewish holy sites.", significance: "Peaceful conquest of the third holiest city in Islam, with unparalleled religious tolerance.", era: "khilafah", category: "political" },
  { id: "e18", year: "650 CE / 29 AH", yearNum: 650, title: "Compilation of the Quran — Uthman's Mushaf", arabic: "جمع القرآن — المصحف العثماني", description: "Caliph Uthman ibn Affan (RA) commissioned a standardized copy of the Quran and distributed it to all Muslim lands, ordering all other variants burned. This preserved the Quran in one unified text.", significance: "The establishment of a single authoritative Quran that exists unchanged to this day.", era: "khilafah", category: "revelation" },
  { id: "e19", year: "661 CE / 41 AH", yearNum: 661, title: "Martyrdom of Ali RA — End of Rightly Guided Caliphate", arabic: "استشهاد علي رضي الله عنه", description: "Ali ibn Abi Talib (RA), the fourth caliph and cousin of the Prophet ﷺ, was assassinated in the mosque of Kufa. His death marked the end of the Rightly Guided Caliphate and the beginning of dynastic rule.", significance: "End of the most blessed era of Islamic governance after the Prophet ﷺ.", era: "khilafah", category: "person" },

  // Abbasid
  { id: "e20", year: "762 CE / 145 AH", yearNum: 762, title: "Founding of Baghdad — City of Peace", arabic: "تأسيس بغداد — مدينة السلام", description: "Caliph Al-Mansur founded Baghdad (Madinat al-Salam) on the banks of the Tigris River. It became the capital of the Abbasid Caliphate and would grow into the largest city in the world.", significance: "Baghdad became the center of the Islamic Golden Age and world civilization.", era: "abbasid", category: "architecture" },
  { id: "e21", year: "830 CE / 215 AH", yearNum: 830, title: "Bayt al-Hikmah — House of Wisdom", arabic: "بيت الحكمة", description: "Caliph Al-Ma'mun established Bayt al-Hikmah in Baghdad — the greatest library and translation center of the medieval world. Scholars from across the world translated Greek, Persian, and Indian texts into Arabic.", significance: "The pinnacle of the Islamic Golden Age — preserving and advancing human knowledge.", era: "abbasid", category: "scholarship" },
  { id: "e22", year: "1258 CE / 656 AH", yearNum: 1258, title: "Mongol Sack of Baghdad", arabic: "سقوط بغداد", description: "Hulagu Khan's Mongol forces besieged and destroyed Baghdad. The Caliph Al-Musta'sim was killed. Libraries were burned and the Tigris River allegedly ran black with the ink of scholars' books.", significance: "One of the most catastrophic events in Islamic history — the fall of the Abbasid Caliphate.", era: "abbasid", category: "battle" },

  // Ottoman
  { id: "e23", year: "1453 CE / 857 AH", yearNum: 1453, title: "Conquest of Constantinople", arabic: "فتح القسطنطينية", description: "Sultan Muhammad II (Fatih) at age 21 conquered Constantinople after a 53-day siege, fulfilling the prophecy of the Prophet ﷺ: 'Constantinople will surely be conquered — what a blessed commander he is!' The Hagia Sophia became a mosque.", significance: "Fulfillment of a prophetic hadith — ending the Byzantine Empire after 1,100 years.", era: "ottoman", category: "battle" },
  { id: "e24", year: "1520–1566 CE / 926–974 AH", yearNum: 1520, title: "Reign of Suleiman the Magnificent", arabic: "عهد سليمان القانوني", description: "The Ottoman Empire reached its peak under Suleiman I — extending from Vienna to the Persian Gulf, from Morocco to Ukraine. He was known as 'the Lawgiver' for his extensive legal reforms.", significance: "The height of Ottoman power and Islamic civilization in the early modern period.", era: "ottoman", category: "political" },
  { id: "e25", year: "1924 CE / 1342 AH", yearNum: 1924, title: "Abolition of the Ottoman Caliphate", arabic: "إلغاء الخلافة العثمانية", description: "Mustafa Kemal Atatürk abolished the Ottoman Caliphate on 3 March 1924, ending 1,300 years of continuous Islamic political leadership. The last Caliph Abdulmejid II was exiled.", significance: "The end of the last Caliphate — a defining moment of the modern Muslim world.", era: "ottoman", category: "political" },

  // Modern
  { id: "e26", year: "1928 CE", yearNum: 1928, title: "Founding of the Muslim Brotherhood", arabic: "تأسيس الإخوان المسلمين", description: "Hassan al-Banna founded the Muslim Brotherhood in Egypt with the goal of Islamic revival through education, social services, and political engagement.", significance: "The emergence of modern Islamic political movements.", era: "modern", category: "political" },
  { id: "e27", year: "1947 CE", yearNum: 1947, title: "Independence of Pakistan — First Islamic Republic", arabic: "استقلال باكستان", description: "Pakistan became the first nation created in the name of Islam on 14 August 1947 under Muhammad Ali Jinnah, providing a homeland for South Asian Muslims.", significance: "The first modern state established explicitly as a homeland for Muslims.", era: "modern", category: "political" },
  { id: "e28", year: "1969 CE", yearNum: 1969, title: "Organisation of Islamic Cooperation Founded", arabic: "تأسيس منظمة التعاون الإسلامي", description: "The OIC was established in Rabat, Morocco following the arson attack on Masjid al-Aqsa, uniting 57 Muslim-majority nations.", significance: "The largest intergovernmental organization after the United Nations.", era: "modern", category: "political" },
];

type FilterEra = Era | "all";
type FilterCat = keyof typeof CAT_CONFIG | "all";

export default function IslamicHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);
  const [eraFilter, setEraFilter] = useState<FilterEra>("all");
  const [catFilter, setCatFilter] = useState<FilterCat>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return EVENTS.filter(e => {
      const matchEra = eraFilter === "all" || e.era === eraFilter;
      const matchCat = catFilter === "all" || e.category === catFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || e.title.toLowerCase().includes(q) || e.year.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
      return matchEra && matchCat && matchSearch;
    });
  }, [eraFilter, catFilter, search]);

  const s = makeStyles(colors);

  if (selectedEvent) {
    const eraCfg = ERA_CONFIG[selectedEvent.era];
    const catCfg = CAT_CONFIG[selectedEvent.category];
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedEvent(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.headerYear, { color: colors.gold }]}>{selectedEvent.year}</Text>
          </View>
          <View style={[s.eraBadge, { backgroundColor: eraCfg.color + "20" }]}>
            <Text style={s.eraEmoji}>{eraCfg.icon}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.detailContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={[s.detailHero, { backgroundColor: eraCfg.color + "12", borderColor: eraCfg.color + "40" }]}>
            <Text style={[s.detailEra, { color: eraCfg.color }]}>{eraCfg.icon} {eraCfg.label}</Text>
            <Text style={[s.detailTitle, { color: colors.foreground }]}>{selectedEvent.title}</Text>
            {selectedEvent.arabic && (
              <Text style={[s.detailArabic, { color: colors.gold }]}>{selectedEvent.arabic}</Text>
            )}
            <View style={[s.catChip, { backgroundColor: catCfg.color + "20" }]}>
              <Text style={[s.catChipText, { color: catCfg.color }]}>{catCfg.label}</Text>
            </View>
          </View>

          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>HISTORICAL ACCOUNT</Text>
          <View style={[s.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.descText, { color: colors.foreground }]}>{selectedEvent.description}</Text>
          </View>

          <Text style={[s.secLabel, { color: colors.mutedForeground }]}>HISTORICAL SIGNIFICANCE</Text>
          <View style={[s.sigCard, { backgroundColor: eraCfg.color + "10", borderColor: eraCfg.color + "30" }]}>
            <Feather name="star" size={16} color={eraCfg.color} />
            <Text style={[s.sigText, { color: colors.foreground }]}>{selectedEvent.significance}</Text>
          </View>

          <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelectedEvent(null)}>
            <Feather name="arrow-left" size={16} color={colors.foreground} />
            <Text style={[s.backBtnText, { color: colors.foreground }]}>Back to Timeline</Text>
          </TouchableOpacity>
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
          <Text style={[s.title, { color: colors.foreground }]}>Islamic History</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>التاريخ الإسلامي</Text>
        </View>
        <View style={[s.countBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[s.countText, { color: colors.primary }]}>{filtered.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search events, dates, people…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity> : null}
      </View>

      {/* Era filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
        <TouchableOpacity style={[s.filterChip, { backgroundColor: eraFilter === "all" ? colors.primary : colors.card, borderColor: eraFilter === "all" ? colors.primary : colors.border }]} onPress={() => setEraFilter("all")}>
          <Text style={[s.filterChipText, { color: eraFilter === "all" ? "#FFF" : colors.mutedForeground }]}>All Eras</Text>
        </TouchableOpacity>
        {(Object.entries(ERA_CONFIG) as [Era, typeof ERA_CONFIG[Era]][]).map(([key, cfg]) => (
          <TouchableOpacity
            key={key}
            style={[s.filterChip, { backgroundColor: eraFilter === key ? cfg.color : colors.card, borderColor: eraFilter === key ? cfg.color : colors.border }]}
            onPress={() => setEraFilter(key)}
          >
            <Text style={s.filterChipEmoji}>{cfg.icon}</Text>
            <Text style={[s.filterChipText, { color: eraFilter === key ? "#FFF" : colors.mutedForeground }]}>{cfg.label.split(" ")[0]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Timeline */}
        {filtered.map((event, index) => {
          const eraCfg = ERA_CONFIG[event.era];
          const catCfg = CAT_CONFIG[event.category];
          const showEraHeader = index === 0 || filtered[index - 1].era !== event.era;

          return (
            <React.Fragment key={event.id}>
              {showEraHeader && (
                <View style={[s.eraHeader, { backgroundColor: eraCfg.color + "15", borderColor: eraCfg.color + "40" }]}>
                  <Text style={s.eraHeaderEmoji}>{eraCfg.icon}</Text>
                  <Text style={[s.eraHeaderText, { color: eraCfg.color }]}>{eraCfg.label}</Text>
                </View>
              )}
              <TouchableOpacity style={s.eventRow} onPress={() => setSelectedEvent(event)} activeOpacity={0.8}>
                {/* Timeline line */}
                <View style={s.timelineLeft}>
                  <View style={[s.timelineDot, { backgroundColor: eraCfg.color }]} />
                  {index < filtered.length - 1 && filtered[index + 1].era === event.era && (
                    <View style={[s.timelineLine, { backgroundColor: eraCfg.color + "40" }]} />
                  )}
                </View>
                <View style={[s.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={s.eventTop}>
                    <Text style={[s.eventYear, { color: eraCfg.color }]}>{event.year}</Text>
                    <View style={[s.catPill, { backgroundColor: catCfg.color + "15" }]}>
                      <Text style={[s.catPillText, { color: catCfg.color }]}>{catCfg.label}</Text>
                    </View>
                  </View>
                  <Text style={[s.eventTitle, { color: colors.foreground }]}>{event.title}</Text>
                  {event.arabic && (
                    <Text style={[s.eventArabic, { color: colors.gold }]}>{event.arabic}</Text>
                  )}
                  <Text style={[s.eventPreview, { color: colors.mutedForeground }]} numberOfLines={2}>{event.description}</Text>
                  <View style={s.eventFooter}>
                    <Text style={[s.readMore, { color: eraCfg.color }]}>Read more</Text>
                    <Feather name="arrow-right" size={12} color={eraCfg.color} />
                  </View>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No events match your search</Text>
          </View>
        )}
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
    headerYear: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    eraBadge: { padding: 8, borderRadius: 10 },
    eraEmoji: { fontSize: 18 },
    countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    countText: { fontSize: 13, fontFamily: "Inter_700Bold" },

    searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, gap: 8, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

    filterScroll: { maxHeight: 44 },
    filterContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
    filterChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    filterChipEmoji: { fontSize: 12 },
    filterChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    listContent: { paddingTop: 12, paddingRight: 16 },
    eraHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 12, marginTop: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
    eraHeaderEmoji: { fontSize: 16 },
    eraHeaderText: { fontSize: 13, fontFamily: "Inter_700Bold" },

    eventRow: { flexDirection: "row", marginLeft: 16, marginBottom: 12, gap: 14 },
    timelineLeft: { width: 16, alignItems: "center" },
    timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 18 },
    timelineLine: { width: 2, flex: 1, marginTop: 4 },
    eventCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14 },
    eventTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    eventYear: { fontSize: 12, fontFamily: "Inter_700Bold" },
    catPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    catPillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    eventTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4, lineHeight: 20 },
    eventArabic: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 6 },
    eventPreview: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 8 },
    eventFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
    readMore: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    empty: { alignItems: "center", paddingVertical: 60 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },

    // Detail
    detailContent: { paddingHorizontal: 16, paddingTop: 16 },
    detailHero: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
    detailEra: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
    detailTitle: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 28, marginBottom: 10 },
    detailArabic: { fontSize: 18, fontFamily: "Inter_400Regular", textAlign: "right", marginBottom: 12 },
    catChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
    catChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    secLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
    descCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
    descText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 24 },
    sigCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
    sigText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 14, justifyContent: "center" },
    backBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
