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
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { useColors } from "@/hooks/useColors";

function getQiblaDirection(lat: number, lon: number): number {
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;
  const dLon = ((kaabaLon - lon) * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const kaabaLatRad = (kaabaLat * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(kaabaLatRad);
  const x =
    Math.cos(latRad) * Math.sin(kaabaLatRad) -
    Math.sin(latRad) * Math.cos(kaabaLatRad) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

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
  const [error, setError] = useState<string | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [compassAngle, setCompassAngle] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [aligned, setAligned] = useState(false);

  const compassAnim = useRef(new Animated.Value(0)).current;
  const needleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  const prevCompass = useRef(0);
  const prevNeedle = useRef(0);

  // Glow pulse when aligned
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

  // Smooth rotation animation
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

  useEffect(() => {
    let magSub: any = null;

    const init = async () => {
      try {
        let lat = 21.3891;
        let lon = 39.8579;
        let city = "Makkah (default)";

        if (Platform.OS !== "web") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;
            const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
            city = geo?.city ?? geo?.region ?? "Your Location";
          }
        }

        setLocation({ lat, lon, city });
        const qibla = getQiblaDirection(lat, lon);
        setQiblaAngle(qibla);

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
          // Static display on web
          animateRotation(needleAnim, prevNeedle, qibla);
        }
        setLoading(false);
      } catch (e: any) {
        setError("Could not determine location");
        setLoading(false);
      }
    };

    init();
    return () => magSub?.remove();
  }, []);

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
          <Text style={s.headerTitle}>Qibla Direction</Text>
          <Text style={s.headerSub}>اتجاه القبلة</Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <View style={[s.infoBar, { backgroundColor: colors.navy }]}>
        {location && (
          <View style={s.infoItem}>
            <Feather name="map-pin" size={14} color="#FFFFFF80" />
            <Text style={s.infoText}>{location.city}</Text>
          </View>
        )}
        <View style={s.infoItem}>
          <Feather name="navigation" size={14} color={colors.gold} />
          <Text style={[s.infoText, { color: colors.gold }]}>{qiblaAngle.toFixed(1)}° from North</Text>
        </View>
        <View style={s.infoItem}>
          <Feather name="globe" size={14} color="#FFFFFF80" />
          <Text style={s.infoText}>{distance} to Kaaba</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Getting your location...</Text>
        </View>
      ) : (
        <View style={s.compassSection}>
          {aligned && (
            <View style={[s.alignedBanner, { backgroundColor: "#22C55E20", borderColor: "#22C55E" }]}>
              <Feather name="check-circle" size={16} color="#22C55E" />
              <Text style={s.alignedText}>Facing Qibla!</Text>
            </View>
          )}

          {/* Compass */}
          <View style={s.compassOuter}>
            <Animated.View style={[s.compassRose, { transform: [{ rotate: Platform.OS === "web" ? "0deg" : compassRotation }] }]}>
              {/* Cardinal directions */}
              {["N", "E", "S", "W"].map((dir, i) => (
                <View
                  key={dir}
                  style={[s.cardinal, { transform: [{ rotate: `${i * 90}deg` }, { translateY: -108 }] }]}
                >
                  <Text style={[s.cardinalText, dir === "N" && { color: "#EF4444", fontFamily: "Inter_700Bold" }]}>{dir}</Text>
                </View>
              ))}
              {/* Tick marks */}
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
              ? "Rotate your device toward the Kaaba icon above"
              : "Hold your device flat and rotate until the Kaaba icon points away from you"}
          </Text>

          {/* Degrees display */}
          <View style={[s.degreesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.degreeItem}>
              <Text style={[s.degreeValue, { color: colors.gold }]}>{qiblaAngle.toFixed(1)}°</Text>
              <Text style={[s.degreeLabel, { color: colors.mutedForeground }]}>Qibla Direction</Text>
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
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
    headerCenter: { flex: 1, alignItems: "center" },
    headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF" },
    headerSub: { fontSize: 13, color: "#FFFFFF80" },
    infoBar: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, paddingBottom: 16, flexWrap: "wrap", gap: 8 },
    infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    infoText: { fontSize: 12, color: "#FFFFFF80", fontFamily: "Inter_400Regular" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    loadingText: { fontSize: 15, fontFamily: "Inter_400Regular" },
    compassSection: { flex: 1, alignItems: "center", paddingTop: 20, paddingHorizontal: 20 },
    alignedBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, marginBottom: 16 },
    alignedText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#22C55E" },
    compassOuter: { width: 260, height: 260, alignItems: "center", justifyContent: "center", marginBottom: 24 },
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
    degreeValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
    degreeLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
    degreeDivider: { width: 1 },
  });
}
