import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const CALCULATION_METHODS = [
  { id: "MWL", name: "Muslim World League", region: "Europe, Far East, parts of USA" },
  { id: "ISNA", name: "Islamic Society of North America", region: "North America" },
  { id: "Egypt", name: "Egyptian General Authority", region: "Africa, Syria, Lebanon, Malaysia" },
  { id: "Makkah", name: "Umm al-Qura (Makkah)", region: "Arabian Peninsula" },
  { id: "Karachi", name: "University of Islamic Sciences, Karachi", region: "Pakistan, Bangladesh, India, Afghanistan" },
  { id: "Tehran", name: "Institute of Geophysics, Tehran", region: "Iran, Some Shia communities" },
  { id: "Kuwait", name: "Kuwait", region: "Kuwait" },
  { id: "Qatar", name: "Qatar", region: "Qatar" },
  { id: "Singapore", name: "Majlis Ugama Islam Singapura", region: "Singapore, Malaysia, Indonesia" },
  { id: "Turkey", name: "Presidency of Religious Affairs", region: "Turkey" },
];

const ASR_METHODS = [
  { id: "Standard", name: "Standard (Shafi'i, Maliki, Hanbali)" },
  { id: "Hanafi", name: "Hanafi" },
];

const LANGUAGES = [
  { id: "en", name: "English", native: "English" },
  { id: "ar", name: "Arabic", native: "العربية" },
  { id: "ur", name: "Urdu", native: "اردو" },
  { id: "tr", name: "Turkish", native: "Türkçe" },
  { id: "fr", name: "French", native: "Français" },
];

const QURAN_FONTS = [
  { id: "default", name: "Default Arabic" },
  { id: "uthmani", name: "Uthmani Script" },
  { id: "indopak", name: "Indo-Pak Script" },
];

const SETTINGS_KEY = "@app_settings";

interface AppSettings {
  calculationMethod: string;
  asrMethod: string;
  language: string;
  quranFont: string;
  showTranslation: boolean;
  showTransliteration: boolean;
  showUrdu: boolean;
  darkMode: string; // "system" | "dark" | "light"
  prayerNotifications: boolean;
  reminderBeforePrayer: number;
  audioAutoPlay: boolean;
  fontSize: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  calculationMethod: "MWL",
  asrMethod: "Standard",
  language: "en",
  quranFont: "default",
  showTranslation: true,
  showTransliteration: true,
  showUrdu: false,
  darkMode: "system",
  prayerNotifications: false,
  reminderBeforePrayer: 10,
  audioAutoPlay: false,
  fontSize: 24,
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
      if (raw) {
        try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  const save = (update: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...update };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const s = makeStyles(colors);
  const currentMethod = CALCULATION_METHODS.find(m => m.id === settings.calculationMethod);
  const currentLang = LANGUAGES.find(l => l.id === settings.language);

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );

  const ToggleRow = ({ icon, label, sublabel, value, onToggle }: { icon: string; label: string; sublabel?: string; value: boolean; onToggle: () => void }) => (
    <View style={[s.row, { borderBottomColor: colors.border }]}>
      <View style={[s.rowIcon, { backgroundColor: colors.primary + "20" }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={s.rowBody}>
        <Text style={[s.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {sublabel && <Text style={[s.rowSublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "80" }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
      />
    </View>
  );

  const SelectRow = ({ icon, label, value, onPress, color }: { icon: string; label: string; value: string; onPress: () => void; color?: string }) => (
    <TouchableOpacity style={[s.row, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={[s.rowIcon, { backgroundColor: (color ?? colors.primary) + "20" }]}>
        <Feather name={icon as any} size={16} color={color ?? colors.primary} />
      </View>
      <View style={s.rowBody}>
        <Text style={[s.rowLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <Text style={[s.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  const SliderRow = ({ icon, label, value, min, max, step, onDecrease, onIncrease, displayValue }: any) => (
    <View style={[s.row, { borderBottomColor: colors.border }]}>
      <View style={[s.rowIcon, { backgroundColor: colors.primary + "20" }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={s.rowBody}>
        <Text style={[s.rowLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <View style={s.stepperRow}>
        <TouchableOpacity style={[s.stepBtn, { borderColor: colors.border }]} onPress={onDecrease}>
          <Feather name="minus" size={14} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.stepValue, { color: colors.foreground }]}>{displayValue ?? value}</Text>
        <TouchableOpacity style={[s.stepBtn, { borderColor: colors.border }]} onPress={onIncrease}>
          <Feather name="plus" size={14} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showMethodPicker) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
          <TouchableOpacity onPress={() => setShowMethodPicker(false)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.foreground }]}>Calculation Method</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          {CALCULATION_METHODS.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[s.pickerRow, {
                backgroundColor: settings.calculationMethod === m.id ? colors.primary + "15" : colors.card,
                borderColor: settings.calculationMethod === m.id ? colors.primary : colors.border,
              }]}
              onPress={() => { save({ calculationMethod: m.id }); setShowMethodPicker(false); }}
            >
              <View style={s.pickerBody}>
                <Text style={[s.pickerLabel, { color: colors.foreground }]}>{m.name}</Text>
                <Text style={[s.pickerSub, { color: colors.mutedForeground }]}>{m.region}</Text>
              </View>
              {settings.calculationMethod === m.id && <Feather name="check-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (showLanguagePicker) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
          <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.foreground }]}>Display Language</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40, padding: 16 }}>
          {LANGUAGES.map(l => (
            <TouchableOpacity
              key={l.id}
              style={[s.pickerRow, {
                backgroundColor: settings.language === l.id ? colors.primary + "15" : colors.card,
                borderColor: settings.language === l.id ? colors.primary : colors.border,
              }]}
              onPress={() => { save({ language: l.id }); setShowLanguagePicker(false); }}
            >
              <View style={s.pickerBody}>
                <Text style={[s.pickerLabel, { color: colors.foreground }]}>{l.name}</Text>
                <Text style={[s.pickerSub, { color: colors.mutedForeground }]}>{l.native}</Text>
              </View>
              {settings.language === l.id && <Feather name="check-circle" size={20} color={colors.primary} />}
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
        <Text style={[s.title, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Prayer Calculation */}
        <SectionHeader title="PRAYER CALCULATION" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SelectRow
            icon="compass"
            label="Calculation Method"
            value={currentMethod?.name.split(",")[0] ?? "MWL"}
            onPress={() => setShowMethodPicker(true)}
          />
          <View style={[s.row, { borderBottomColor: "transparent" }]}>
            <View style={[s.rowIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="clock" size={16} color={colors.primary} />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: colors.foreground }]}>Asr Juristic Method</Text>
            </View>
            <View style={s.segmented}>
              {ASSR_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[s.segBtn, {
                    backgroundColor: settings.asrMethod === opt ? colors.primary : "transparent",
                    borderColor: colors.border,
                  }]}
                  onPress={() => save({ asrMethod: opt })}
                >
                  <Text style={[s.segBtnText, { color: settings.asrMethod === opt ? "#FFF" : colors.mutedForeground }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ToggleRow
            icon="bell"
            label="Prayer Time Alerts"
            sublabel="Receive notifications at prayer times"
            value={settings.prayerNotifications}
            onToggle={() => save({ prayerNotifications: !settings.prayerNotifications })}
          />
          {settings.prayerNotifications && (
            <SliderRow
              icon="clock"
              label="Reminder before prayer"
              value={settings.reminderBeforePrayer}
              displayValue={`${settings.reminderBeforePrayer} min`}
              onDecrease={() => save({ reminderBeforePrayer: Math.max(0, settings.reminderBeforePrayer - 5) })}
              onIncrease={() => save({ reminderBeforePrayer: Math.min(60, settings.reminderBeforePrayer + 5) })}
            />
          )}
        </View>

        {/* Quran Display */}
        <SectionHeader title="QURAN DISPLAY" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ToggleRow
            icon="eye"
            label="Show English Translation"
            value={settings.showTranslation}
            onToggle={() => save({ showTranslation: !settings.showTranslation })}
          />
          <ToggleRow
            icon="type"
            label="Show Transliteration"
            value={settings.showTransliteration}
            onToggle={() => save({ showTransliteration: !settings.showTransliteration })}
          />
          <ToggleRow
            icon="align-right"
            label="Show Urdu Translation"
            value={settings.showUrdu}
            onToggle={() => save({ showUrdu: !settings.showUrdu })}
          />
          <SliderRow
            icon="type"
            label="Arabic Font Size"
            value={settings.fontSize}
            displayValue={`${settings.fontSize}px`}
            onDecrease={() => save({ fontSize: Math.max(16, settings.fontSize - 2) })}
            onIncrease={() => save({ fontSize: Math.min(40, settings.fontSize + 2) })}
          />
          <ToggleRow
            icon="play-circle"
            label="Auto-play Next Ayah"
            sublabel="Continue recitation automatically"
            value={settings.audioAutoPlay}
            onToggle={() => save({ audioAutoPlay: !settings.audioAutoPlay })}
          />
        </View>

        {/* Display */}
        <SectionHeader title="DISPLAY" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SelectRow
            icon="globe"
            label="Display Language"
            value={currentLang?.name ?? "English"}
            onPress={() => setShowLanguagePicker(true)}
            color="#0891B2"
          />
          <View style={[s.row, { borderBottomColor: "transparent" }]}>
            <View style={[s.rowIcon, { backgroundColor: "#6366F1" + "20" }]}>
              <Feather name="moon" size={16} color="#6366F1" />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: colors.foreground }]}>Appearance</Text>
            </View>
            <View style={s.segmented}>
              {(["Light", "Dark", "System"] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[s.segBtn, {
                    backgroundColor: settings.darkMode === opt.toLowerCase() ? "#6366F1" : "transparent",
                    borderColor: colors.border,
                  }]}
                  onPress={() => save({ darkMode: opt.toLowerCase() })}
                >
                  <Text style={[s.segBtnText, {
                    color: settings.darkMode === opt.toLowerCase() ? "#FFF" : colors.mutedForeground,
                    fontSize: 10,
                  }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* About */}
        <SectionHeader title="ABOUT" />
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={[s.rowIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="info" size={16} color={colors.primary} />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: colors.foreground }]}>App Version</Text>
            </View>
            <Text style={[s.rowValue, { color: colors.mutedForeground }]}>1.0.0</Text>
          </View>
          <View style={[s.row, { borderBottomColor: colors.border }]}>
            <View style={[s.rowIcon, { backgroundColor: colors.gold + "20" }]}>
              <Feather name="book" size={16} color={colors.gold} />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: colors.foreground }]}>Quran Source</Text>
            </View>
            <Text style={[s.rowValue, { color: colors.mutedForeground }]}>Tanzil.net</Text>
          </View>
          <View style={[s.row, { borderBottomColor: "transparent" }]}>
            <View style={[s.rowIcon, { backgroundColor: colors.teal + "20" }]}>
              <Feather name="mic" size={16} color={colors.teal} />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowLabel, { color: colors.foreground }]}>Audio Source</Text>
            </View>
            <Text style={[s.rowValue, { color: colors.mutedForeground }]}>EveryAyah.com</Text>
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity
          style={[s.resetBtn, { borderColor: colors.destructive + "60", backgroundColor: colors.destructive + "10" }]}
          onPress={() => {
            Alert.alert("Reset Settings", "Reset all settings to defaults?", [
              { text: "Cancel", style: "cancel" },
              { text: "Reset", style: "destructive", onPress: () => { setSettings(DEFAULT_SETTINGS); AsyncStorage.removeItem(SETTINGS_KEY); }},
            ]);
          }}
        >
          <Feather name="refresh-cw" size={16} color={colors.destructive} />
          <Text style={[s.resetBtnText, { color: colors.destructive }]}>Reset to Defaults</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const ASSR_OPTIONS = ["Standard", "Hanafi"];

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
    title: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    content: { paddingHorizontal: 16, paddingTop: 16 },

    sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8, marginTop: 8 },
    card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 4 },

    row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, gap: 12 },
    rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    rowBody: { flex: 1 },
    rowLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
    rowSublabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
    rowValue: { fontSize: 13, fontFamily: "Inter_400Regular" },

    segmented: { flexDirection: "row", gap: 4 },
    segBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    segBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

    stepperRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    stepBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    stepValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", minWidth: 50, textAlign: "center" },

    pickerRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1 },
    pickerBody: { flex: 1 },
    pickerLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    pickerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },

    resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, marginTop: 16 },
    resetBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  });
}
