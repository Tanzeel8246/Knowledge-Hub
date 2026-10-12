import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Animated,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface DhikrPreset {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  color: string;
}

const DEFAULT_PRESETS: DhikrPreset[] = [
  { id: "subhanallah", arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah", translation: "Glory be to Allah", target: 33, color: "#0D9373" },
  { id: "alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", translation: "All praise is for Allah", target: 33, color: "#D4A017" },
  { id: "allahuakbar", arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", translation: "Allah is the Greatest", target: 34, color: "#1D4ED8" },
  { id: "lailaha", arabic: "لَا إِلَهَ إِلَّا اللَّهُ", transliteration: "La ilaha illa Allah", translation: "There is no god but Allah", target: 100, color: "#7C3AED" },
  { id: "astaghfirullah", arabic: "أَسْتَغْفِرُ اللَّهَ", transliteration: "Astaghfirullah", translation: "I seek forgiveness from Allah", target: 100, color: "#DC2626" },
  { id: "salawat", arabic: "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ", transliteration: "Allahumma Salli ala Muhammad", translation: "Blessings upon the Prophet (PBUH)", target: 100, color: "#059669" },
  { id: "hauqala", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", transliteration: "La hawla wa la quwwata illa billah", translation: "There is no power except with Allah", target: 33, color: "#D97706" },
  { id: "bismillah", arabic: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", transliteration: "Bismillah ir-Rahman ir-Rahim", translation: "In the name of Allah, the Most Gracious", target: 21, color: "#0891B2" },
];

const STORAGE_KEY = "tasbih_history";
const CUSTOM_DHIKR_KEY = "custom_dhikr";
const SESSIONS_KEY = "tasbih_sessions";

interface HistoryEntry {
  dhikrId: string;
  transliteration: string;
  count: number;
  target: number;
  date: string;
}

export default function TasbihScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [customPresets, setCustomPresets] = useState<DhikrPreset[]>([]);
  const allPresets = [...customPresets, ...DEFAULT_PRESETS];
  
  const [selected, setSelected] = useState<DhikrPreset>(DEFAULT_PRESETS[0]);
  const [count, setCount] = useState(0);
  const [sessionMap, setSessionMap] = useState<Record<string, number>>({});
  const [totalSession, setTotalSession] = useState(0);
  
  const [showPresets, setShowPresets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  
  const [newDhikr, setNewDhikr] = useState({ arabic: "", transliteration: "", translation: "", target: "33" });
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) setHistory(JSON.parse(data));
    });
    AsyncStorage.getItem(CUSTOM_DHIKR_KEY).then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setCustomPresets(parsed);
      }
    });
    AsyncStorage.getItem(SESSIONS_KEY).then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setSessionMap(parsed);
        if (parsed[DEFAULT_PRESETS[0].id]) {
          setCount(parsed[DEFAULT_PRESETS[0].id]);
        }
      }
    });
  }, []);

  const saveSessions = (newMap: Record<string, number>) => {
    setSessionMap(newMap);
    AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(newMap));
  };

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, speed: 60 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
  }, [scaleAnim]);

  const handleCount = useCallback(async () => {
    const newCount = count + 1;
    setCount(newCount);
    setTotalSession(t => t + 1);
    saveSessions({ ...sessionMap, [selected.id]: newCount });
    animatePress();

    if (vibrateEnabled && Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.timing(progressAnim, {
      toValue: Math.min(newCount / selected.target, 1),
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (newCount === selected.target) {
      if (vibrateEnabled && Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const entry: HistoryEntry = {
        dhikrId: selected.id,
        transliteration: selected.transliteration,
        count: newCount,
        target: selected.target,
        date: new Date().toISOString(),
      };
      const updated = [entry, ...history].slice(0, 100); // keep last 100
      setHistory(updated);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [count, selected, animatePress, vibrateEnabled, history, progressAnim, sessionMap]);

  const handleReset = () => {
    if (count > 0 && count < selected.target) {
      // optionally save partial session to history
      const entry: HistoryEntry = {
        dhikrId: selected.id,
        transliteration: selected.transliteration,
        count,
        target: selected.target,
        date: new Date().toISOString(),
      };
      const updated = [entry, ...history].slice(0, 100);
      setHistory(updated);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    setCount(0);
    saveSessions({ ...sessionMap, [selected.id]: 0 });
    progressAnim.setValue(0);
  };

  const selectPreset = (preset: DhikrPreset) => {
    saveSessions({ ...sessionMap, [selected.id]: count });
    
    const nextCount = sessionMap[preset.id] || 0;
    setSelected(preset);
    setCount(nextCount);
    progressAnim.setValue(Math.min(nextCount / preset.target, 1));
    setShowPresets(false);
  };

  const saveCustomDhikr = () => {
    if (!newDhikr.transliteration.trim()) {
      Alert.alert("Error", "Please enter at least the transliteration/name of the Dhikr.");
      return;
    }
    const custom: DhikrPreset = {
      id: "custom_" + Date.now(),
      arabic: newDhikr.arabic || newDhikr.transliteration,
      transliteration: newDhikr.transliteration,
      translation: newDhikr.translation || "Custom Dhikr",
      target: parseInt(newDhikr.target) || 33,
      color: "#0891B2" // nice teal color for custom
    };
    const updated = [custom, ...customPresets];
    setCustomPresets(updated);
    AsyncStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
    setShowAddCustom(false);
    setNewDhikr({ arabic: "", transliteration: "", translation: "", target: "33" });
    selectPreset(custom);
  };

  const deleteCustomDhikr = (id: string) => {
    Alert.alert("Delete Dhikr", "Are you sure you want to delete this custom dhikr?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        const updated = customPresets.filter(p => p.id !== id);
        setCustomPresets(updated);
        AsyncStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated));
        if (selected.id === id) {
          selectPreset(DEFAULT_PRESETS[0]);
        }
      }}
    ]);
  };

  const s = makeStyles(colors);
  const progressPercent = Math.min((count / selected.target) * 100, 100);
  const remaining = selected.target - count;
  const isComplete = count >= selected.target;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]}>Tasbih Counter</Text>
          <Text style={[s.titleAr, { color: colors.gold }]}>التسبيح</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => setVibrateEnabled(!vibrateEnabled)} style={s.headerBtn}>
            <Feather name={vibrateEnabled ? "smartphone" : "slash"} size={18} color={vibrateEnabled ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowHistory(true)} style={s.headerBtn}>
            <Feather name="clock" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dhikr Selector */}
      <TouchableOpacity
        style={[s.dhikrSelector, { backgroundColor: colors.card, borderColor: selected.color + "40" }]}
        onPress={() => setShowPresets(true)}
      >
        <View style={s.dhikrSelectorLeft}>
          <Text style={[s.dhikrArabic, { color: colors.foreground }]}>{selected.arabic}</Text>
          <Text style={[s.dhikrTranslit, { color: selected.color }]}>{selected.transliteration}</Text>
          <Text style={[s.dhikrTranslation, { color: colors.mutedForeground }]}>{selected.translation}</Text>
        </View>
        <View style={s.dhikrSelectorRight}>
          <View style={[s.targetBadge, { backgroundColor: selected.color + "20" }]}>
            <Text style={[s.targetText, { color: selected.color }]}>×{selected.target}</Text>
          </View>
          <Feather name="chevron-down" size={18} color={colors.mutedForeground} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>

      {/* Progress Arc */}
      <View style={s.progressSection}>
        <View style={s.progressBarContainer}>
          <View style={[s.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View style={[s.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              backgroundColor: isComplete ? "#22C55E" : selected.color,
            }]} />
          </View>
          <Text style={[s.progressText, { color: colors.mutedForeground }]}>
            {progressPercent.toFixed(0)}% complete
          </Text>
        </View>
      </View>

      {/* Main Counter Button */}
      <View style={s.counterSection}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[s.counterBtn, {
              backgroundColor: isComplete ? "#22C55E" : selected.color,
              shadowColor: isComplete ? "#22C55E" : selected.color,
            }]}
            onPress={handleCount}
            activeOpacity={0.9}
          >
            <Text style={s.counterCount}>{count}</Text>
            <Text style={s.counterTarget}>of {selected.target}</Text>
            {isComplete && <Text style={s.counterDone}>✓ Complete!</Text>}
          </TouchableOpacity>
        </Animated.View>

        <View style={s.counterInfo}>
          {!isComplete ? (
            <Text style={[s.remainingText, { color: colors.mutedForeground }]}>
              {remaining} remaining
            </Text>
          ) : (
            <TouchableOpacity
              style={[s.continueBtn, { backgroundColor: selected.color + "20", borderColor: selected.color }]}
              onPress={handleCount}
            >
              <Text style={[s.continueBtnText, { color: selected.color }]}>Continue +{count - selected.target}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Session Stats + Reset */}
      <View style={[s.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: colors.foreground }]}>{totalSession}</Text>
          <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Session Total</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.border }]} />
        <View style={s.statItem}>
          <Text style={[s.statValue, { color: colors.foreground }]}>{Math.floor(totalSession / selected.target)}</Text>
          <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Rounds</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={s.statItem} onPress={handleReset}>
          <Feather name="refresh-ccw" size={20} color={colors.mutedForeground} />
          <Text style={[s.statLabel, { color: colors.mutedForeground }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Presets Modal */}
      <Modal visible={showPresets} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPresets(false)}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Choose Dhikr</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setShowAddCustom(true)}>
                <Feather name="plus" size={24} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPresets(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
            {allPresets.map(p => {
              const isCustom = p.id.startsWith("custom_");
              const savedCount = sessionMap[p.id] || 0;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[s.presetItem, {
                    backgroundColor: selected.id === p.id ? p.color + "15" : colors.card,
                    borderColor: selected.id === p.id ? p.color : colors.border,
                  }]}
                  onPress={() => selectPreset(p)}
                >
                  <View style={[s.presetDot, { backgroundColor: p.color }]} />
                  <View style={s.presetInfo}>
                    <Text style={[s.presetArabic, { color: colors.foreground }]}>{p.arabic}</Text>
                    <Text style={[s.presetTranslit, { color: p.color }]}>{p.transliteration}</Text>
                    <Text style={[s.presetTranslation, { color: colors.mutedForeground }]}>{p.translation}</Text>
                    {savedCount > 0 && selected.id !== p.id && (
                      <Text style={[s.presetSaved, { color: colors.mutedForeground }]}>Session paused at: {savedCount}</Text>
                    )}
                  </View>
                  <View style={s.presetRight}>
                    <View style={[s.presetTarget, { backgroundColor: p.color + "20" }]}>
                      <Text style={[s.presetTargetText, { color: p.color }]}>×{p.target}</Text>
                    </View>
                    {isCustom && (
                      <TouchableOpacity onPress={() => deleteCustomDhikr(p.id)} style={{ padding: 8 }}>
                        <Feather name="trash-2" size={16} color={colors.destructive} />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Add Custom Dhikr Modal */}
      <Modal visible={showAddCustom} animationType="fade" transparent={true} onRequestClose={() => setShowAddCustom(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.customModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.customModalTitle, { color: colors.foreground }]}>Add Custom Dhikr</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Arabic (Optional)"
              placeholderTextColor={colors.mutedForeground}
              value={newDhikr.arabic}
              onChangeText={t => setNewDhikr({ ...newDhikr, arabic: t })}
              textAlign="right"
            />
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Name / Transliteration *"
              placeholderTextColor={colors.mutedForeground}
              value={newDhikr.transliteration}
              onChangeText={t => setNewDhikr({ ...newDhikr, transliteration: t })}
            />
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Meaning (Optional)"
              placeholderTextColor={colors.mutedForeground}
              value={newDhikr.translation}
              onChangeText={t => setNewDhikr({ ...newDhikr, translation: t })}
            />
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Target Count (e.g. 33)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={newDhikr.target}
              onChangeText={t => setNewDhikr({ ...newDhikr, target: t })}
            />
            <View style={s.customModalActions}>
              <TouchableOpacity style={s.customBtn} onPress={() => setShowAddCustom(false)}>
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.customBtn, { backgroundColor: colors.primary }]} onPress={saveCustomDhikr}>
                <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowHistory(false)}>
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>History</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {history.length > 0 && (
                <TouchableOpacity onPress={() => { setHistory([]); AsyncStorage.removeItem(STORAGE_KEY); }}>
                  <Feather name="trash-2" size={20} color="#DC2626" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
          {history.length === 0 ? (
            <View style={s.historyEmpty}>
              <Feather name="clock" size={40} color={colors.mutedForeground} />
              <Text style={[s.historyEmptyText, { color: colors.mutedForeground }]}>No history yet</Text>
              <Text style={[s.historyEmptySub, { color: colors.mutedForeground }]}>Complete dhikr sessions to see them here</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const preset = allPresets.find(p => p.id === item.dhikrId);
                const color = preset?.color ?? colors.primary;
                return (
                  <View style={[s.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.historyDot, { backgroundColor: color }]} />
                    <View style={s.historyInfo}>
                      <Text style={[s.historyTranslit, { color: colors.foreground }]}>{item.transliteration}</Text>
                      <Text style={[s.historyDate, { color: colors.mutedForeground }]}>
                        {new Date(item.date).toLocaleDateString()} · {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                    <View style={s.historyCount}>
                      <Text style={[s.historyCountNum, { color: color }]}>{item.count}</Text>
                      <Text style={[s.historyCountTarget, { color: colors.mutedForeground }]}>/ {item.target}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
    headerCenter: { flex: 1 },
    title: { fontSize: 20, fontFamily: "Inter_700Bold" },
    titleAr: { fontSize: 13 },
    headerRight: { flexDirection: "row", gap: 8 },
    headerBtn: { padding: 6 },
    dhikrSelector: { marginHorizontal: 20, borderRadius: 16, padding: 18, borderWidth: 2, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    dhikrSelectorLeft: { flex: 1 },
    dhikrSelectorRight: { alignItems: "flex-end", gap: 4 },
    dhikrArabic: { fontSize: 22, textAlign: "left", marginBottom: 4, fontFamily: "Inter_400Regular" },
    dhikrTranslit: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    dhikrTranslation: { fontSize: 12, fontFamily: "Inter_400Regular" },
    targetBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    targetText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    progressSection: { paddingHorizontal: 20, marginBottom: 16 },
    progressBarContainer: { gap: 8 },
    progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 4 },
    progressText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
    counterSection: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
    counterBtn: {
      width: 220, height: 220, borderRadius: 110, alignItems: "center", justifyContent: "center",
      shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
    },
    counterCount: { fontSize: 72, fontFamily: "Inter_700Bold", color: "#FFF", lineHeight: 80 },
    counterTarget: { fontSize: 16, color: "#FFFFFF90", fontFamily: "Inter_400Regular" },
    counterDone: { fontSize: 14, color: "#FFF", fontFamily: "Inter_600SemiBold", marginTop: 4 },
    counterInfo: { alignItems: "center" },
    remainingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    continueBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
    continueBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    statsBar: { flexDirection: "row", marginHorizontal: 20, marginBottom: 20, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
    statItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 4 },
    statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
    statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
    statDivider: { width: 1 },
    modal: { flex: 1 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
    presetItem: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, borderWidth: 1.5, marginBottom: 10, gap: 12 },
    presetDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
    presetInfo: { flex: 1 },
    presetArabic: { fontSize: 18, marginBottom: 2 },
    presetTranslit: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 1 },
    presetTranslation: { fontSize: 11, fontFamily: "Inter_400Regular" },
    presetSaved: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 4 },
    presetRight: { alignItems: "flex-end", gap: 8 },
    presetTarget: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    presetTargetText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    
    modalOverlay: { flex: 1, backgroundColor: "#00000080", alignItems: "center", justifyContent: "center", padding: 20 },
    customModal: { width: "100%", borderRadius: 20, padding: 20, borderWidth: 1 },
    customModalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 16 },
    input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, fontFamily: "Inter_400Regular" },
    customModalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
    customBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    
    historyEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    historyEmptyText: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    historyEmptySub: { fontSize: 13, fontFamily: "Inter_400Regular" },
    historyItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8, gap: 12 },
    historyDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
    historyInfo: { flex: 1 },
    historyTranslit: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    historyDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
    historyCount: { alignItems: "flex-end" },
    historyCountNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
    historyCountTarget: { fontSize: 11, fontFamily: "Inter_400Regular" },
  });
}
