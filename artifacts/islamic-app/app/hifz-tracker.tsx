import React, { useState, useEffect, useMemo } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const HIFZ_KEY = "@hifz_data";

// 114 Surahs: [number, name, arabic, ayahs, juz, type]
const SURAHS: [number, string, string, number, number, "Meccan" | "Medinan"][] = [
  [1,"Al-Fatihah","الفاتحة",7,1,"Meccan"],
  [2,"Al-Baqarah","البقرة",286,1,"Medinan"],
  [3,"Ali 'Imran","آل عمران",200,3,"Medinan"],
  [4,"An-Nisa","النساء",176,4,"Medinan"],
  [5,"Al-Ma'idah","المائدة",120,6,"Medinan"],
  [6,"Al-An'am","الأنعام",165,7,"Meccan"],
  [7,"Al-A'raf","الأعراف",206,8,"Meccan"],
  [8,"Al-Anfal","الأنفال",75,9,"Medinan"],
  [9,"At-Tawbah","التوبة",129,10,"Medinan"],
  [10,"Yunus","يونس",109,11,"Meccan"],
  [11,"Hud","هود",123,11,"Meccan"],
  [12,"Yusuf","يوسف",111,12,"Meccan"],
  [13,"Ar-Ra'd","الرعد",43,13,"Medinan"],
  [14,"Ibrahim","إبراهيم",52,13,"Meccan"],
  [15,"Al-Hijr","الحجر",99,14,"Meccan"],
  [16,"An-Nahl","النحل",128,14,"Meccan"],
  [17,"Al-Isra","الإسراء",111,15,"Meccan"],
  [18,"Al-Kahf","الكهف",110,15,"Meccan"],
  [19,"Maryam","مريم",98,16,"Meccan"],
  [20,"Ta-Ha","طه",135,16,"Meccan"],
  [21,"Al-Anbiya","الأنبياء",112,17,"Meccan"],
  [22,"Al-Hajj","الحج",78,17,"Medinan"],
  [23,"Al-Mu'minun","المؤمنون",118,18,"Meccan"],
  [24,"An-Nur","النور",64,18,"Medinan"],
  [25,"Al-Furqan","الفرقان",77,18,"Meccan"],
  [26,"Ash-Shu'ara","الشعراء",227,19,"Meccan"],
  [27,"An-Naml","النمل",93,19,"Meccan"],
  [28,"Al-Qasas","القصص",88,20,"Meccan"],
  [29,"Al-Ankabut","العنكبوت",69,20,"Meccan"],
  [30,"Ar-Rum","الروم",60,21,"Meccan"],
  [31,"Luqman","لقمان",34,21,"Meccan"],
  [32,"As-Sajdah","السجدة",30,21,"Meccan"],
  [33,"Al-Ahzab","الأحزاب",73,21,"Medinan"],
  [34,"Saba","سبإ",54,22,"Meccan"],
  [35,"Fatir","فاطر",45,22,"Meccan"],
  [36,"Ya-Sin","يس",83,22,"Meccan"],
  [37,"As-Saffat","الصافات",182,23,"Meccan"],
  [38,"Sad","ص",88,23,"Meccan"],
  [39,"Az-Zumar","الزمر",75,23,"Meccan"],
  [40,"Ghafir","غافر",85,24,"Meccan"],
  [41,"Fussilat","فصلت",54,24,"Meccan"],
  [42,"Ash-Shura","الشورى",53,25,"Meccan"],
  [43,"Az-Zukhruf","الزخرف",89,25,"Meccan"],
  [44,"Ad-Dukhan","الدخان",59,25,"Meccan"],
  [45,"Al-Jathiyah","الجاثية",37,25,"Meccan"],
  [46,"Al-Ahqaf","الأحقاف",35,26,"Meccan"],
  [47,"Muhammad","محمد",38,26,"Medinan"],
  [48,"Al-Fath","الفتح",29,26,"Medinan"],
  [49,"Al-Hujurat","الحجرات",18,26,"Medinan"],
  [50,"Qaf","ق",45,26,"Meccan"],
  [51,"Adh-Dhariyat","الذاريات",60,26,"Meccan"],
  [52,"At-Tur","الطور",49,27,"Meccan"],
  [53,"An-Najm","النجم",62,27,"Meccan"],
  [54,"Al-Qamar","القمر",55,27,"Meccan"],
  [55,"Ar-Rahman","الرحمن",78,27,"Medinan"],
  [56,"Al-Waqi'ah","الواقعة",96,27,"Meccan"],
  [57,"Al-Hadid","الحديد",29,27,"Medinan"],
  [58,"Al-Mujadila","المجادلة",22,28,"Medinan"],
  [59,"Al-Hashr","الحشر",24,28,"Medinan"],
  [60,"Al-Mumtahanah","الممتحنة",13,28,"Medinan"],
  [61,"As-Saf","الصف",14,28,"Medinan"],
  [62,"Al-Jumu'ah","الجمعة",11,28,"Medinan"],
  [63,"Al-Munafiqun","المنافقون",11,28,"Medinan"],
  [64,"At-Taghabun","التغابن",18,28,"Medinan"],
  [65,"At-Talaq","الطلاق",12,28,"Medinan"],
  [66,"At-Tahrim","التحريم",12,28,"Medinan"],
  [67,"Al-Mulk","الملك",30,29,"Meccan"],
  [68,"Al-Qalam","القلم",52,29,"Meccan"],
  [69,"Al-Haqqah","الحاقة",52,29,"Meccan"],
  [70,"Al-Ma'arij","المعارج",44,29,"Meccan"],
  [71,"Nuh","نوح",28,29,"Meccan"],
  [72,"Al-Jinn","الجن",28,29,"Meccan"],
  [73,"Al-Muzzammil","المزمل",20,29,"Meccan"],
  [74,"Al-Muddaththir","المدثر",56,29,"Meccan"],
  [75,"Al-Qiyamah","القيامة",40,29,"Meccan"],
  [76,"Al-Insan","الإنسان",31,29,"Medinan"],
  [77,"Al-Mursalat","المرسلات",50,29,"Meccan"],
  [78,"An-Naba","النبأ",40,30,"Meccan"],
  [79,"An-Nazi'at","النازعات",46,30,"Meccan"],
  [80,"Abasa","عبس",42,30,"Meccan"],
  [81,"At-Takwir","التكوير",29,30,"Meccan"],
  [82,"Al-Infitar","الانفطار",19,30,"Meccan"],
  [83,"Al-Mutaffifin","المطففين",36,30,"Meccan"],
  [84,"Al-Inshiqaq","الانشقاق",25,30,"Meccan"],
  [85,"Al-Buruj","البروج",22,30,"Meccan"],
  [86,"At-Tariq","الطارق",17,30,"Meccan"],
  [87,"Al-A'la","الأعلى",19,30,"Meccan"],
  [88,"Al-Ghashiyah","الغاشية",26,30,"Meccan"],
  [89,"Al-Fajr","الفجر",30,30,"Meccan"],
  [90,"Al-Balad","البلد",20,30,"Meccan"],
  [91,"Ash-Shams","الشمس",15,30,"Meccan"],
  [92,"Al-Layl","الليل",21,30,"Meccan"],
  [93,"Ad-Duha","الضحى",11,30,"Meccan"],
  [94,"Ash-Sharh","الشرح",8,30,"Meccan"],
  [95,"At-Tin","التين",8,30,"Meccan"],
  [96,"Al-Alaq","العلق",19,30,"Meccan"],
  [97,"Al-Qadr","القدر",5,30,"Meccan"],
  [98,"Al-Bayyinah","البينة",8,30,"Medinan"],
  [99,"Az-Zalzalah","الزلزلة",8,30,"Medinan"],
  [100,"Al-Adiyat","العاديات",11,30,"Meccan"],
  [101,"Al-Qari'ah","القارعة",11,30,"Meccan"],
  [102,"At-Takathur","التكاثر",8,30,"Meccan"],
  [103,"Al-Asr","العصر",3,30,"Meccan"],
  [104,"Al-Humazah","الهمزة",9,30,"Meccan"],
  [105,"Al-Fil","الفيل",5,30,"Meccan"],
  [106,"Quraysh","قريش",4,30,"Meccan"],
  [107,"Al-Ma'un","الماعون",7,30,"Meccan"],
  [108,"Al-Kawthar","الكوثر",3,30,"Meccan"],
  [109,"Al-Kafirun","الكافرون",6,30,"Meccan"],
  [110,"An-Nasr","النصر",3,30,"Medinan"],
  [111,"Al-Masad","المسد",5,30,"Meccan"],
  [112,"Al-Ikhlas","الإخلاص",4,30,"Meccan"],
  [113,"Al-Falaq","الفلق",5,30,"Meccan"],
  [114,"An-Nas","الناس",6,30,"Meccan"],
];

type HifzStatus = "not_started" | "in_progress" | "memorized" | "revision";

interface SurahHifz {
  status: HifzStatus;
  memorizedAyahs: number;
  lastRevised?: string;
  notes?: string;
}

type HifzData = Record<number, SurahHifz>;

const STATUS_CONFIG: Record<HifzStatus, { label: string; color: string; icon: string }> = {
  not_started: { label: "Not Started", color: "#94A3B8", icon: "circle" },
  in_progress: { label: "In Progress", color: "#F59E0B", icon: "clock" },
  memorized: { label: "Memorized", color: "#16A34A", icon: "check-circle" },
  revision: { label: "Needs Revision", color: "#0891B2", icon: "refresh-cw" },
};

const JUZ_NAMES: Record<number, string> = {
  1: "Juz 1", 2: "Juz 2", 3: "Juz 3", 4: "Juz 4", 5: "Juz 5",
  6: "Juz 6", 7: "Juz 7", 8: "Juz 8", 9: "Juz 9", 10: "Juz 10",
  11: "Juz 11", 12: "Juz 12", 13: "Juz 13", 14: "Juz 14", 15: "Juz 15",
  16: "Juz 16", 17: "Juz 17", 18: "Juz 18", 19: "Juz 19", 20: "Juz 20",
  21: "Juz 21", 22: "Juz 22", 23: "Juz 23", 24: "Juz 24", 25: "Juz 25",
  26: "Juz 26", 27: "Juz 27", 28: "Juz 28", 29: "Juz 29", 30: "Juz 'Amma",
};

type FilterType = "all" | "juz30" | "memorized" | "in_progress" | "revision";

export default function HifzTrackerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HifzData>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [groupByJuz, setGroupByJuz] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HIFZ_KEY).then(raw => {
      if (raw) { try { setData(JSON.parse(raw)); } catch {} }
    });
  }, []);

  const saveData = (updated: HifzData) => {
    setData(updated);
    AsyncStorage.setItem(HIFZ_KEY, JSON.stringify(updated));
  };

  const updateStatus = (surahNum: number, status: HifzStatus) => {
    const surah = SURAHS.find(s => s[0] === surahNum)!;
    const updated: HifzData = {
      ...data,
      [surahNum]: {
        ...data[surahNum],
        status,
        memorizedAyahs: status === "memorized" ? surah[3] : (data[surahNum]?.memorizedAyahs ?? 0),
        lastRevised: status === "revision" ? new Date().toISOString().split("T")[0] : data[surahNum]?.lastRevised,
      },
    };
    saveData(updated);
    setSelected(null);
  };

  const updateAyahs = (surahNum: number, count: number) => {
    const surah = SURAHS.find(s => s[0] === surahNum)!;
    const total = surah[3];
    const clamped = Math.max(0, Math.min(total, count));
    const updated: HifzData = {
      ...data,
      [surahNum]: {
        ...data[surahNum],
        memorizedAyahs: clamped,
        status: clamped === 0 ? "not_started" : clamped >= total ? "memorized" : "in_progress",
      },
    };
    saveData(updated);
  };

  // Stats
  const stats = useMemo(() => {
    const memorized = SURAHS.filter(s => data[s[0]]?.status === "memorized").length;
    const inProgress = SURAHS.filter(s => data[s[0]]?.status === "in_progress").length;
    const revision = SURAHS.filter(s => data[s[0]]?.status === "revision").length;
    const totalAyahsMem = SURAHS.reduce((acc, s) => acc + (data[s[0]]?.memorizedAyahs ?? 0), 0);
    const totalAyahs = 6236;
    const pct = Math.round((memorized / 114) * 100);
    return { memorized, inProgress, revision, totalAyahsMem, totalAyahs, pct };
  }, [data]);

  // Filter
  const filtered = useMemo(() => {
    return SURAHS.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s[1].toLowerCase().includes(q) || s[2].includes(q) || String(s[0]).includes(q);
      const status = data[s[0]]?.status ?? "not_started";
      const matchFilter =
        filter === "all" ? true :
        filter === "juz30" ? s[4] === 30 :
        filter === "memorized" ? status === "memorized" :
        filter === "in_progress" ? status === "in_progress" :
        filter === "revision" ? status === "revision" : true;
      return matchSearch && matchFilter;
    });
  }, [search, filter, data]);

  // Group by Juz
  const grouped = useMemo(() => {
    if (!groupByJuz) return null;
    const groups: Record<number, typeof SURAHS> = {};
    filtered.forEach(s => {
      if (!groups[s[4]]) groups[s[4]] = [];
      groups[s[4]].push(s);
    });
    return groups;
  }, [filtered, groupByJuz]);

  const colors2 = colors;
  const s = makeStyles(colors2);

  // Selected surah modal
  if (selected !== null) {
    const surah = SURAHS.find(s => s[0] === selected);
    if (!surah) return null;
    const hifz = data[selected] ?? { status: "not_started" as HifzStatus, memorizedAyahs: 0 };
    const pct = surah[3] > 0 ? Math.round((hifz.memorizedAyahs / surah[3]) * 100) : 0;

    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.foreground }]}>{surah[1]}</Text>
            <Text style={[s.titleAr, { color: colors.gold }]}>{surah[2]}</Text>
          </View>
          <Text style={[s.surahNum, { color: colors.mutedForeground }]}>#{surah[0]}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {/* Surah info */}
          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { color: colors.mutedForeground }]}>Total Ayahs</Text>
              <Text style={[s.infoValue, { color: colors.foreground }]}>{surah[3]}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={[s.infoLabel, { color: colors.mutedForeground }]}>Juz</Text>
              <Text style={[s.infoValue, { color: colors.foreground }]}>{JUZ_NAMES[surah[4]]}</Text>
            </View>
            <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[s.infoLabel, { color: colors.mutedForeground }]}>Revelation</Text>
              <Text style={[s.infoValue, { color: colors.foreground }]}>{surah[5]}</Text>
            </View>
          </View>

          {/* Ayah progress */}
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>AYAHS MEMORIZED</Text>
          <View style={[s.ayahCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.ayahCount, { color: colors.foreground }]}>{hifz.memorizedAyahs} / {surah[3]}</Text>
            <Text style={[s.ayahPct, { color: colors.primary }]}>{pct}%</Text>
            <View style={[s.progressBar, { backgroundColor: colors.border }]}>
              <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: pct === 100 ? "#16A34A" : colors.primary }]} />
            </View>
            <View style={s.ayahBtns}>
              <TouchableOpacity style={[s.ayahBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => updateAyahs(selected, hifz.memorizedAyahs - 1)}>
                <Feather name="minus" size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.ayahBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => updateAyahs(selected, hifz.memorizedAyahs + 1)}>
                <Feather name="plus" size={18} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.ayahBtnFull, { backgroundColor: colors.primary }]} onPress={() => updateAyahs(selected, surah[3])}>
                <Feather name="check-circle" size={16} color="#FFF" />
                <Text style={s.ayahBtnFullText}>Full Surah</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.ayahBtnFull, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => updateAyahs(selected, 0)}>
                <Text style={[s.ayahBtnFullText, { color: colors.mutedForeground }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status */}
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>STATUS</Text>
          <View style={s.statusGrid}>
            {(Object.entries(STATUS_CONFIG) as [HifzStatus, typeof STATUS_CONFIG[HifzStatus]][]).map(([key, cfg]) => (
              <TouchableOpacity
                key={key}
                style={[s.statusBtn, {
                  backgroundColor: hifz.status === key ? cfg.color + "20" : colors.card,
                  borderColor: hifz.status === key ? cfg.color : colors.border,
                  borderWidth: hifz.status === key ? 2 : 1,
                }]}
                onPress={() => updateStatus(selected, key)}
              >
                <Feather name={cfg.icon as any} size={16} color={cfg.color} />
                <Text style={[s.statusLabel, { color: hifz.status === key ? cfg.color : colors.mutedForeground }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {hifz.lastRevised && (
            <Text style={[s.lastRevised, { color: colors.mutedForeground }]}>
              Last revised: {hifz.lastRevised}
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  const renderSurahRow = (surah: typeof SURAHS[number]) => {
    const hifz = data[surah[0]] ?? { status: "not_started" as HifzStatus, memorizedAyahs: 0 };
    const cfg = STATUS_CONFIG[hifz.status];
    const pct = surah[3] > 0 ? (hifz.memorizedAyahs / surah[3]) : 0;

    return (
      <TouchableOpacity key={surah[0]} style={[s.surahRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setSelected(surah[0])}>
        <View style={[s.surahNumBox, { backgroundColor: cfg.color + "20" }]}>
          <Text style={[s.surahNumText, { color: cfg.color }]}>{surah[0]}</Text>
        </View>
        <View style={s.surahBody}>
          <View style={s.surahTop}>
            <Text style={[s.surahName, { color: colors.foreground }]}>{surah[1]}</Text>
            <Text style={[s.surahAr, { color: colors.gold }]}>{surah[2]}</Text>
          </View>
          <View style={s.surahMeta}>
            <Text style={[s.surahMetaText, { color: colors.mutedForeground }]}>{surah[3]} ayahs · {surah[5]}</Text>
            {hifz.status !== "not_started" && (
              <View style={[s.statusChip, { backgroundColor: cfg.color + "15" }]}>
                <Feather name={cfg.icon as any} size={10} color={cfg.color} />
                <Text style={[s.statusChipText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            )}
          </View>
          {hifz.status !== "not_started" && pct > 0 && (
            <View style={[s.miniBar, { backgroundColor: colors.border }]}>
              <View style={[s.miniBarFill, { width: `${pct * 100}%` as any, backgroundColor: hifz.status === "memorized" ? "#16A34A" : cfg.color }]} />
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={16} color={colors.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Hifz Tracker</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>متابعة الحفظ</Text>
        </View>
        <TouchableOpacity onPress={() => setGroupByJuz(!groupByJuz)} style={[s.groupBtn, { backgroundColor: groupByJuz ? colors.primary + "20" : colors.card, borderColor: groupByJuz ? colors.primary : colors.border }]}>
          <Feather name="layers" size={14} color={groupByJuz ? colors.primary : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[s.statsRow, { borderBottomColor: colors.border }]}>
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: "#16A34A" }]}>{stats.memorized}</Text>
          <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Memorized</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.border }]} />
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: "#F59E0B" }]}>{stats.inProgress}</Text>
          <Text style={[s.statLabel, { color: colors.mutedForeground }]}>In Progress</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.border }]} />
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: "#0891B2" }]}>{stats.revision}</Text>
          <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Revision</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.border }]} />
        <View style={s.statBox}>
          <Text style={[s.statNum, { color: colors.primary }]}>{stats.pct}%</Text>
          <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Complete</Text>
        </View>
      </View>

      {/* Overall progress bar */}
      <View style={s.overallBar}>
        <View style={[s.overallBarBg, { backgroundColor: colors.border }]}>
          <View style={[s.overallBarFill, { width: `${stats.pct}%` as any, backgroundColor: "#16A34A" }]} />
          {stats.inProgress > 0 && (
            <View style={[s.overallBarFill2, { width: `${Math.round((stats.inProgress / 114) * 100)}%` as any, backgroundColor: "#F59E0B" }]} />
          )}
        </View>
        <Text style={[s.overallBarText, { color: colors.mutedForeground }]}>{stats.totalAyahsMem.toLocaleString()} / 6,236 ayahs</Text>
      </View>

      {/* Search + filter */}
      <View style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search surah name…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity> : null}
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
        {([
          ["all", "All 114"],
          ["juz30", "Juz 'Amma"],
          ["memorized", "Memorized"],
          ["in_progress", "In Progress"],
          ["revision", "Revision"],
        ] as [FilterType, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[s.filterChip, { backgroundColor: filter === key ? colors.primary : colors.card, borderColor: filter === key ? colors.primary : colors.border }]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.filterChipText, { color: filter === key ? "#FFF" : colors.mutedForeground }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Surah list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 40 }]}>
        {groupByJuz && grouped
          ? Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([juz, surahs]) => (
            <View key={juz}>
              <Text style={[s.juzLabel, { color: colors.mutedForeground, backgroundColor: colors.background }]}>{JUZ_NAMES[Number(juz)]}</Text>
              {surahs.map(renderSurahRow)}
            </View>
          ))
          : filtered.map(renderSurahRow)
        }
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No surahs match your search</Text>
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
    titleAr: { fontSize: 12, fontFamily: "Inter_400Regular" },
    surahNum: { fontSize: 13, fontFamily: "Inter_400Regular" },
    groupBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },

    statsRow: { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 12 },
    statBox: { flex: 1, alignItems: "center" },
    statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
    statDivider: { width: 1, marginVertical: 6 },

    overallBar: { paddingHorizontal: 16, paddingVertical: 10 },
    overallBarBg: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" },
    overallBarFill: { height: 8 },
    overallBarFill2: { height: 8 },
    overallBarText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 5, textAlign: "right" },

    searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, gap: 8, marginBottom: 8 },
    searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

    filterScroll: { maxHeight: 44 },
    filterContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

    listContent: { paddingHorizontal: 16, paddingTop: 10 },
    juzLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, paddingVertical: 6, paddingTop: 14 },

    surahRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
    surahNumBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    surahNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    surahBody: { flex: 1 },
    surahTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    surahName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    surahAr: { fontSize: 14, fontFamily: "Inter_400Regular" },
    surahMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
    surahMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
    statusChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    statusChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
    miniBar: { height: 3, borderRadius: 2, marginTop: 6, overflow: "hidden" },
    miniBarFill: { height: 3 },

    empty: { alignItems: "center", paddingVertical: 60 },
    emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },

    // Detail view
    infoCard: { borderRadius: 14, borderWidth: 1, marginBottom: 16 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", padding: 14, borderBottomWidth: 1 },
    infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
    infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
    ayahCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, alignItems: "center" },
    ayahCount: { fontSize: 28, fontFamily: "Inter_700Bold" },
    ayahPct: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
    progressBar: { width: "100%", height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 16 },
    progressFill: { height: 10, borderRadius: 5 },
    ayahBtns: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
    ayahBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    ayahBtnFull: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    ayahBtnFullText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },

    statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    statusBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, flex: 1, minWidth: "45%" },
    statusLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

    lastRevised: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 14, textAlign: "center" },
  });
}
