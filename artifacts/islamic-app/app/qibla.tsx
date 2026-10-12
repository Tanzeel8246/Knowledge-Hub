import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
  Easing,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_LOCATION_STORAGE_KEY = "@user_last_saved_location_v2";
import { Magnetometer } from "expo-sensors";
import { useColors } from "@/hooks/useColors";
import {
  calculateQiblaAzimuth,
  calculateSolarPosition,
  calculateDailyShadowQiblaSchedule,
  checkRasadAlQibla,
  ShadowAngleTime,
} from "@/utils/solarQibla";

function getDistanceToKaaba(lat: number, lon: number): string {
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;
  const R = 6371;
  const dLat = ((kaabaLat - lat) * Math.PI) / 180;
  const dLon = ((kaabaLon - lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((kaabaLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist >= 1000
    ? `${(dist / 1000).toFixed(1)}k km`
    : `${Math.round(dist)} km`;
}

export default function QiblaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [compassAngle, setCompassAngle] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [aligned, setAligned] = useState(false);
  const [activeTab, setActiveTab] = useState<"compass" | "solar">("compass");

  // Comprehensive solar shadow schedule (180°, 135°, 90°, 45°, 0°)
  const [solarData, setSolarData] = useState<{
    sunAzimuth: number;
    sunAltitude: number;
    shadowAngle: number;
    angleDiff: number;
    alignments: ShadowAngleTime[];
    rasadInfo: { isToday: boolean; eventName?: string; timeUtc?: string };
  } | null>(null);

  const compassAnim = useRef(new Animated.Value(0)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  const prevCompass = useRef(0);
  const prevNeedle = useRef(0);

  useEffect(() => {
    if (aligned) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      glowAnim.setValue(1);
    }
  }, [aligned, glowAnim]);

  const animateRotation = (anim: Animated.Value, prev: React.MutableRefObject<number>, target: number) => {
    let delta = target - prev.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const next = prev.current + delta;
    prev.current = next;
    Animated.timing(anim, {
      toValue: next,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const updateSolarCalculations = (lat: number, lon: number, qibla: number) => {
    const now = new Date();
    const pos = calculateSolarPosition(now, lat, lon);
    const schedule = calculateDailyShadowQiblaSchedule(now, lat, lon);
    const rasad = checkRasadAlQibla(now);

    const shadowAzimuth = (pos.azimuth + 180) % 360;
    let diff = Math.abs(shadowAzimuth - qibla);
    if (diff > 180) diff = 360 - diff;

    setSolarData({
      sunAzimuth: pos.azimuth,
      sunAltitude: pos.altitude,
      shadowAngle: shadowAzimuth,
      angleDiff: diff,
      alignments: schedule,
      rasadInfo: rasad,
    });
  };

  useEffect(() => {
    let magSub: any = null;

    const init = async () => {
      try {
        let lat = 24.8607;
        let lon = 67.0011;
        let city = "Karachi, PK";
        let resolved = false;

        // 1. Try GPS
        if (Platform.OS !== "web") {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              lat = loc.coords.latitude;
              lon = loc.coords.longitude;
              const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
              city = geo?.city ?? geo?.region ?? "Your Location";
              resolved = true;
            }
          } catch {}
        }

        // 2. Fallback to cached location from prayer-times
        if (!resolved) {
          try {
            const saved = await AsyncStorage.getItem(LAST_LOCATION_STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.lat && parsed.lng) {
                lat = parsed.lat;
                lon = parsed.lng;
                city = parsed.city;
                resolved = true;
              }
            }
          } catch {}
        }

        setLocation({ lat, lon, city });
        const qibla = calculateQiblaAzimuth(lat, lon);
        setQiblaAngle(qibla);
        updateSolarCalculations(lat, lon, qibla);

        if (Platform.OS !== "web") {
          Magnetometer.setUpdateInterval(100);
          magSub = Magnetometer.addListener(({ x, y }) => {
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            angle = (angle + 360) % 360;
            setCompassAngle(angle);

            const relativeQibla = (qibla - angle + 360) % 360;
            const diff = Math.abs(relativeQibla > 180 ? relativeQibla - 360 : relativeQibla);
            setAligned(diff < 5);

            animateRotation(compassAnim, prevCompass, -angle);
            animateRotation(needleAnim, prevNeedle, relativeQibla);
          });
        } else {
          animateRotation(needleAnim, prevNeedle, qibla);
        }
        setLoading(false);
      } catch (e: any) {
        setLoading(false);
      }
    };

    init();
    return () => magSub?.remove();
  }, []);

  useEffect(() => {
    if (!location) return;
    const interval = setInterval(() => {
      updateSolarCalculations(location.lat, location.lon, qiblaAngle);
    }, 30000);
    return () => clearInterval(interval);
  }, [location, qiblaAngle]);

  const s = makeStyles(colors);
  const distance = location ? getDistanceToKaaba(location.lat, location.lon) : "-";

  const needleRotation = needleAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ["-720deg", "720deg"],
  });
  const compassRotation = compassAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ["-720deg", "720deg"],
  });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.navy }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Qibla & Solar Alignment</Text>
          <Text style={s.headerSub}>اتجاه القبلة وتصحيح ظل الشمس</Text>
        </View>
        <TouchableOpacity onPress={() => location && updateSolarCalculations(location.lat, location.lon, qiblaAngle)}>
          <Feather name="refresh-cw" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { backgroundColor: colors.navy }]}>
        <TouchableOpacity
          style={[s.tabItem, activeTab === "compass" && s.tabItemActive]}
          onPress={() => setActiveTab("compass")}
        >
          <MaterialCommunityIcons name="compass" size={18} color={activeTab === "compass" ? colors.gold : "#FFFFFF70"} />
          <Text style={[s.tabText, activeTab === "compass" && { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
            Magnetic Compass
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabItem, activeTab === "solar" && s.tabItemActive]}
          onPress={() => setActiveTab("solar")}
        >
          <MaterialCommunityIcons name="weather-sunny" size={18} color={activeTab === "solar" ? colors.gold : "#FFFFFF70"} />
          <Text style={[s.tabText, activeTab === "solar" && { color: colors.gold, fontFamily: "Inter_700Bold" }]}>
            سایۂ آفتاب (180°, 135°, 90°)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Bar */}
      <View style={[s.infoBar, { backgroundColor: colors.navy }]}>
        {location && (
          <View style={s.infoItem}>
            <Feather name="map-pin" size={13} color="#FFFFFF80" />
            <Text style={s.infoText}>{location.city}</Text>
          </View>
        )}
        <View style={s.infoItem}>
          <Feather name="navigation" size={13} color={colors.gold} />
          <Text style={[s.infoText, { color: colors.gold }]}>Qibla: {qiblaAngle.toFixed(1)}°</Text>
        </View>
        <View style={s.infoItem}>
          <Feather name="globe" size={13} color="#FFFFFF80" />
          <Text style={s.infoText}>{distance} to Kaaba</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Calculating exact astronomical coordinates...</Text>
        </View>
      ) : activeTab === "compass" ? (
        <ScrollView contentContainerStyle={s.compassSection}>
          {aligned && (
            <View style={[s.alignedBanner, { backgroundColor: "#22C55E20", borderColor: "#22C55E" }]}>
              <Feather name="check-circle" size={16} color="#22C55E" />
              <Text style={s.alignedText}>Facing Qibla! (قبلہ کی سمت درست ہے)</Text>
            </View>
          )}

          {/* Compass Graphic */}
          <View style={s.compassOuter}>
            <Animated.View style={[s.compassRose, { transform: [{ rotate: Platform.OS === "web" ? "0deg" : compassRotation }] }]}>
              {["N", "E", "S", "W"].map((dir, i) => (
                <View
                  key={dir}
                  style={[s.cardinal, { transform: [{ rotate: `${i * 90}deg` }, { translateY: -108 }] }]}
                >
                  <Text style={[s.cardinalText, dir === "N" && { color: "#EF4444", fontFamily: "Inter_700Bold" }]}>{dir}</Text>
                </View>
              ))}
              {Array.from({ length: 36 }, (_, i) => (
                <View
                  key={i}
                  style={[
                    s.tick,
                    { transform: [{ rotate: `${i * 10}deg` }, { translateY: -96 }] },
                    i % 9 === 0 && { height: 12, backgroundColor: colors.foreground },
                  ]}
                />
              ))}
            </Animated.View>

            {/* Qibla Needle */}
            <Animated.View
              style={[
                s.needleContainer,
                { transform: [{ rotate: Platform.OS === "web" ? `${qiblaAngle}deg` : needleRotation }] },
              ]}
            >
              <Animated.View style={[s.kaabaMarker, {
                backgroundColor: aligned ? "#22C55E" : colors.gold,
                shadowColor: aligned ? "#22C55E" : colors.gold,
                transform: [{ scale: glowAnim }],
              }]}>
                <Text style={s.kaabaEmoji}>🕋</Text>
              </Animated.View>
              <View style={[s.needle, { backgroundColor: aligned ? "#22C55E" : colors.gold }]} />
              <View style={[s.needleTail, { backgroundColor: colors.mutedForeground }]} />
            </Animated.View>

            {/* Center dot */}
            <View style={[s.centerDot, { backgroundColor: colors.foreground }]} />
          </View>

          {/* Instruction */}
          <Text style={[s.instruction, { color: colors.mutedForeground }]}>
            {Platform.OS === "web"
              ? "Web view: Point your body toward the Kaaba angle indicated above"
              : "موبائل کو بالکل ہموار (Flat) رکھیں اور گھمائیں یہاں تک کہ خانہ کعبہ کا نشان اوپر آ جائے"}
          </Text>

          {/* Degrees display */}
          <View style={[s.degreesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.degreeItem}>
              <Text style={[s.degreeValue, { color: colors.gold }]}>{qiblaAngle.toFixed(1)}°</Text>
              <Text style={[s.degreeLabel, { color: colors.mutedForeground }]}>Qibla Azimuth</Text>
            </View>
            <View style={[s.degreeDivider, { backgroundColor: colors.border }]} />
            <View style={s.degreeItem}>
              <Text style={[s.degreeValue, { color: colors.primary }]}>{compassAngle.toFixed(1)}°</Text>
              <Text style={[s.degreeLabel, { color: colors.mutedForeground }]}>Compass Heading</Text>
            </View>
            <View style={[s.degreeDivider, { backgroundColor: colors.border }]} />
            <View style={s.degreeItem}>
              <Text style={[s.degreeValue, { color: colors.foreground }]}>{distance}</Text>
              <Text style={[s.degreeLabel, { color: colors.mutedForeground }]}>Distance</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ─── Solar & Comprehensive Shadow-based Qibla Calibration Tab ─── */
        <ScrollView style={s.solarContainer} contentContainerStyle={{ paddingBottom: 50 }}>
          {/* Rasad al-Qibla Notice */}
          {solarData?.rasadInfo.isToday && (
            <View style={[s.rasadCard, { backgroundColor: "#FEF08A25", borderColor: "#EAB308" }]}>
              <MaterialCommunityIcons name="star-shooting" size={24} color="#EAB308" />
              <View style={{ flex: 1 }}>
                <Text style={s.rasadTitle}>مبارک دن: {solarData.rasadInfo.eventName}</Text>
                <Text style={s.rasadSub}>
                  آج سورج ٹھیک خانہ کعبہ کے اوپر (Zenith) ہے۔ {solarData.rasadInfo.timeUtc} پر دنیا کے جس حصے میں بھی سورج نظر آ رہا ہو، اس کا رخ براہ راست قبلہ کی جانب ہے!
                </Text>
              </View>
            </View>
          )}

          {/* Current Solar Status Card */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="weather-sunny" size={22} color="#F59E0B" />
              <Text style={[s.cardTitle, { color: colors.foreground }]}>سورج اور سائے کا موجودہ فلکیاتی رخ</Text>
            </View>

            <View style={s.gridRow}>
              <View style={s.gridCol}>
                <Text style={[s.colVal, { color: "#F59E0B" }]}>{solarData?.sunAzimuth.toFixed(1)}°</Text>
                <Text style={[s.colLabel, { color: colors.mutedForeground }]}>سورج کا زاویہ</Text>
              </View>
              <View style={s.gridCol}>
                <Text style={[s.colVal, { color: colors.primary }]}>{solarData?.sunAltitude.toFixed(1)}°</Text>
                <Text style={[s.colLabel, { color: colors.mutedForeground }]}>افق سے بلندی</Text>
              </View>
              <View style={s.gridCol}>
                <Text style={[s.colVal, { color: colors.gold }]}>{solarData?.shadowAngle.toFixed(1)}°</Text>
                <Text style={[s.colLabel, { color: colors.mutedForeground }]}>سائے کا موجودہ رخ</Text>
              </View>
            </View>

            <View style={[s.diffBadge, { backgroundColor: (solarData?.angleDiff ?? 99) < 2 ? "#22C55E20" : colors.muted }]}>
              <Feather
                name={(solarData?.angleDiff ?? 99) < 2 ? "check-circle" : "compass"}
                size={14}
                color={(solarData?.angleDiff ?? 99) < 2 ? "#22C55E" : colors.mutedForeground}
              />
              <Text style={[s.diffText, { color: (solarData?.angleDiff ?? 99) < 2 ? "#22C55E" : colors.foreground }]}>
                سائے کا قبلہ سے موجودہ فرق: {solarData?.angleDiff.toFixed(1)}°
              </Text>
            </View>
          </View>

          {/* ── Daily Angles Timetable (180°, 135°, 90°, 45°, 0°) ── */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="timetable" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: colors.foreground }]}>روزانہ سائے سے قبلہ درست کرنے کے اوقات</Text>
                <Text style={[s.cardSub, { color: colors.mutedForeground }]}>
                  سال کے ہر دن کے لیے مختلف زاویوں کے قطعی اوقات
                </Text>
              </View>
            </View>

            {solarData?.alignments.map((item, idx) => {
              const isHighlight = item.angleDegrees === 180 || item.angleDegrees === 135 || item.angleDegrees === 90;
              return (
                <View
                  key={idx}
                  style={[
                    s.timingRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
                  ]}
                >
                  <View style={[s.angleBadge, { backgroundColor: isHighlight ? colors.gold + "25" : colors.navy }]}>
                    <Text style={[s.angleBadgeText, { color: isHighlight ? colors.gold : "#FFF" }]}>
                      {item.angleDegrees}°
                    </Text>
                  </View>

                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[s.timingLabel, { color: colors.foreground }]}>{item.angleName}</Text>
                    <Text style={[s.timingDesc, { color: colors.mutedForeground }]}>{item.descriptionUrdu}</Text>
                    <Text style={[s.ruleText, { color: colors.primary }]}>{item.ruleUrdu}</Text>
                  </View>

                  <View style={[s.timeBox, { backgroundColor: item.time ? colors.navy : colors.muted }]}>
                    <Text style={[s.timeBoxText, !item.time && { color: colors.mutedForeground }]}>
                      {item.time ?? "آج نہیں"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Detailed Practical Guide */}
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardHeader}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.gold} />
              <Text style={[s.cardTitle, { color: colors.foreground }]}>سائے کے زاویوں (180°, 135°, 90°) سے قبلہ نکالنے کا طریقہ</Text>
            </View>

            <View style={s.stepItem}>
              <View style={[s.stepNum, { backgroundColor: colors.gold }]}>
                <Text style={s.stepNumText}>۱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepHeading, { color: colors.foreground }]}>180 ڈگری سایہ (مخالفِ شمس - عین قبلہ):</Text>
                <Text style={[s.stepText, { color: colors.mutedForeground }]}>
                  جب سورج قبلہ کے مخالف ہوتا ہے، تو لکڑی کا سایہ عین خانہ کعبہ کی سمت پڑتا ہے۔ لکڑی کی بنیاد سے سائے کے سرے کی طرف کی سیدھ ہی قطعی قبلہ ہے۔
                </Text>
              </View>
            </View>

            <View style={s.stepItem}>
              <View style={[s.stepNum, { backgroundColor: colors.gold }]}>
                <Text style={s.stepNumText}>۲</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepHeading, { color: colors.foreground }]}>135 ڈگری سایہ (تکمیلی زاویہ):</Text>
                <Text style={[s.stepText, { color: colors.mutedForeground }]}>
                  اگر 180° یا 90° کا وقت نہ ملے تو 135° کے وقت پر سائے کی لکیر سے 135 ڈگری (یعنی 90° جمع 45°) ناپ کر قبلہ کی لائن حاصل کی جا سکتی ہے۔
                </Text>
              </View>
            </View>

            <View style={s.stepItem}>
              <View style={[s.stepNum, { backgroundColor: colors.gold }]}>
                <Text style={s.stepNumText}>۳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepHeading, { color: colors.foreground }]}>90 ڈگری سایہ (عمودی زاویہ / گنیا):</Text>
                <Text style={[s.stepText, { color: colors.mutedForeground }]}>
                  90 ڈگری کے وقت پر سائے کی لکیر پر عام معمار کا گنیا (Right Angle Square 90°) رکھ کر کھینچا جانے والا خط سیدھا قبلہ کی طرف رخ کرے گا۔
                </Text>
              </View>
            </View>

            <View style={[s.proofBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <Feather name="shield" size={16} color={colors.primary} />
              <Text style={[s.proofText, { color: colors.foreground }]}>
                یہ سائنسی و فلکیاتی طریقہ کسی بھی کمپاس کی لوہے یا بجلی کے تاروں سے پیدا ہونے والی خرابی سے بالکل پاک ہے اور مساجد کی محراب درست کرنے کے لیے سب سے معتبر مانا جاتا ہے۔
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
    headerSub: { fontSize: 12, color: "#FFFFFF80" },
    tabBar: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
    tabItem: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: "#FFFFFF15",
    },
    tabItemActive: { backgroundColor: "#FFFFFF30" },
    tabText: { fontSize: 12, color: "#FFFFFF80", fontFamily: "Inter_500Medium" },
    infoBar: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, paddingBottom: 14, flexWrap: "wrap", gap: 8 },
    infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    infoText: { fontSize: 11, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
    compassSection: { alignItems: "center", paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 },
    alignedBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginBottom: 16 },
    alignedText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#22C55E" },
    compassOuter: { width: 260, height: 260, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    compassRose: { position: "absolute", width: 240, height: 240, alignItems: "center", justifyContent: "center" },
    cardinal: { position: "absolute", alignItems: "center" },
    cardinalText: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground },
    tick: { position: "absolute", width: 2, height: 8, backgroundColor: colors.mutedForeground, borderRadius: 1 },
    needleContainer: { position: "absolute", width: 4, height: 220, alignItems: "center" },
    kaabaMarker: {
      width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
      shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
    },
    kaabaEmoji: { fontSize: 20 },
    needle: { flex: 1, width: 3, borderRadius: 2 },
    needleTail: { width: 3, height: 40, borderRadius: 2, opacity: 0.4 },
    centerDot: { width: 14, height: 14, borderRadius: 7, zIndex: 10 },
    instruction: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 20 },
    degreesCard: { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden", width: "100%" },
    degreeItem: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
    degreeValue: { fontSize: 17, fontFamily: "Inter_700Bold" },
    degreeLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
    degreeDivider: { width: 1 },

    // Solar Styles
    solarContainer: { flex: 1, padding: 16 },
    rasadCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14, alignItems: "center" },
    rasadTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#EAB308", marginBottom: 4 },
    rasadSub: { fontSize: 12, color: colors.foreground, lineHeight: 18 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
    cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
    cardSub: { fontSize: 11, marginTop: 2 },
    gridRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
    gridCol: { flex: 1, alignItems: "center" },
    colVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
    colLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
    diffBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8 },
    diffText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    timingRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
    angleBadge: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    angleBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
    timingLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
    timingDesc: { fontSize: 11, lineHeight: 16, marginTop: 2 },
    ruleText: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 3 },
    timeBox: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, minWidth: 64, alignItems: "center" },
    timeBoxText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_700Bold" },
    stepItem: { flexDirection: "row", gap: 10, marginBottom: 14, alignItems: "flex-start" },
    stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 2 },
    stepNumText: { color: "#FFF", fontSize: 11, fontFamily: "Inter_700Bold" },
    stepHeading: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
    stepText: { fontSize: 12, lineHeight: 18 },
    proofBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8, alignItems: "center" },
    proofText: { flex: 1, fontSize: 11, lineHeight: 16 },
  });
}
