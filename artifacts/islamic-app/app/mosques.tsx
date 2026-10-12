import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useColors } from "@/hooks/useColors";

interface MosqueItem {
  id: string;
  name: string;
  arabicName?: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  contactNumber?: string;
  capacity?: number;
  hasWuduArea: boolean;
  hasLadiesArea: boolean;
  hasWheelchairAccess: boolean;
  fajrJamaat: string;
  dhuhrJamaat: string;
  asrJamaat: string;
  maghribJamaat: string;
  ishaJamaat: string;
  jummahJamaat: string;
  imamName?: string;
}

const DEFAULT_MOSQUES: MosqueItem[] = [
  {
    id: "faisal",
    name: "Faisal Mosque (فیصل مسجد)",
    arabicName: "مسجد الملك فيصل",
    city: "Islamabad",
    address: "Shah Faisal Ave, E-8, Islamabad",
    latitude: "33.7297",
    longitude: "73.0372",
    capacity: 300000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:15",
    dhuhrJamaat: "13:30",
    asrJamaat: "17:00",
    maghribJamaat: "18:45",
    ishaJamaat: "20:30",
    jummahJamaat: "13:45",
    imamName: "Dr. Zia ur Rehman",
  },
  {
    id: "badshahi",
    name: "Badshahi Mosque (بادشاہی مسجد)",
    arabicName: "مسجد بادشاهي",
    city: "Lahore",
    address: "Walled City, Lahore, Punjab",
    latitude: "31.5881",
    longitude: "74.3094",
    capacity: 100000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:20",
    dhuhrJamaat: "13:30",
    asrJamaat: "17:15",
    maghribJamaat: "18:50",
    ishaJamaat: "20:30",
    jummahJamaat: "14:00",
    imamName: "Maulana Abdul Khabir Azad",
  },
  {
    id: "tooba",
    name: "Masjid e Tooba (مسجدِ طوبٰی)",
    arabicName: "مسجد طوبى",
    city: "Karachi",
    address: "DHA Phase 2, Karachi",
    latitude: "24.8465",
    longitude: "67.0601",
    capacity: 5000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:30",
    dhuhrJamaat: "13:45",
    asrJamaat: "17:15",
    maghribJamaat: "18:55",
    ishaJamaat: "20:45",
    jummahJamaat: "14:15",
    imamName: "Mufti Muhammad Asif",
  },
  {
    id: "haram",
    name: "Masjid al-Haram (مسجد الحرام مکہ)",
    arabicName: "المسجد الحرام بمكة المكرمة",
    city: "Makkah",
    address: "Al Haram, Makkah",
    latitude: "21.4225",
    longitude: "39.8262",
    capacity: 2500000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:10",
    dhuhrJamaat: "12:30",
    asrJamaat: "15:45",
    maghribJamaat: "18:35",
    ishaJamaat: "20:05",
    jummahJamaat: "12:45",
    imamName: "Sheikh Abdul Rahman Al-Sudais",
  },
  {
    id: "nabawi",
    name: "Al-Masjid an-Nabawi (مسجد نبوی مدینہ)",
    arabicName: "المسجد النبوي الشريف بالمدينة",
    city: "Madinah",
    address: "Al Haram, Madinah",
    latitude: "24.4672",
    longitude: "39.6108",
    capacity: 1000000,
    hasWuduArea: true,
    hasLadiesArea: true,
    hasWheelchairAccess: true,
    fajrJamaat: "05:15",
    dhuhrJamaat: "12:30",
    asrJamaat: "15:50",
    maghribJamaat: "18:38",
    ishaJamaat: "20:08",
    jummahJamaat: "12:50",
    imamName: "Sheikh Ali Al-Hudhaify",
  },
];

// Distance calculation using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function MosquesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mosques, setMosques] = useState<MosqueItem[]>(DEFAULT_MOSQUES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load user location
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== "web") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }
        }
      } catch {}
    })();
  }, []);

  // Fetch from server
  const fetchMosques = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/community/mosques");
      if (res.ok) {
        const data = await res.json();
        if (data.mosques && data.mosques.length > 0) {
          setMosques(data.mosques);
        }
      }
    } catch {
      // fallback to DEFAULT_MOSQUES
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMosques();
  }, []);

  const openDirections = (m: MosqueItem) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  const filteredMosques = useMemo(() => {
    return mosques.filter(m => {
      const matchCity = selectedCity === "all" || m.city.toLowerCase() === selectedCity.toLowerCase();
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.arabicName && m.arabicName.toLowerCase().includes(search.toLowerCase())) ||
        m.address.toLowerCase().includes(search.toLowerCase()) ||
        m.city.toLowerCase().includes(search.toLowerCase());
      return matchCity && matchSearch;
    }).map(m => {
      let dist = null;
      if (userLocation) {
        dist = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(m.latitude), parseFloat(m.longitude));
      }
      return { ...m, distance: dist };
    }).sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });
  }, [mosques, search, selectedCity, userLocation]);

  const cities = ["all", "Islamabad", "Lahore", "Karachi", "Makkah", "Madinah"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), backgroundColor: colors.navy }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nearby Mosques</Text>
          <Text style={styles.headerSubtitle}>مساجد و اوقاتِ جماعت</Text>
        </View>
        <TouchableOpacity onPress={fetchMosques} style={styles.backBtn}>
          <Feather name="refresh-cw" size={18} color="#FFFFFF90" />
        </TouchableOpacity>
      </View>

      {/* Search & City Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            placeholder="مسجد یا محلہ تلاش کریں..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
          {cities.map((c) => {
            const active = selectedCity === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedCity(c)}
                style={[
                  styles.cityChip,
                  {
                    backgroundColor: active ? colors.primary : colors.background,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.cityText, { color: active ? "#FFF" : colors.mutedForeground }]}>
                  {c === "all" ? "تمام مساجد (All)" : c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Mosque List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredMosques.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="map-pin" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>کوئی مسجد نہیں ملی</Text>
          </View>
        ) : (
          filteredMosques.map((m) => (
            <View
              key={m.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* Card Top */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mosqueName, { color: colors.foreground }]}>{m.name}</Text>
                  {m.arabicName && <Text style={[styles.arabicName, { color: colors.gold }]}>{m.arabicName}</Text>}
                  <Text style={[styles.addressText, { color: colors.mutedForeground }]}>
                    <Feather name="map-pin" size={12} color="#EF4444" /> {m.address}
                  </Text>
                </View>
                {m.distance !== null && (
                  <View style={[styles.distanceBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.distanceText, { color: colors.primary }]}>{m.distance} km</Text>
                  </View>
                )}
              </View>

              {/* Jama'at Timings Grid */}
              <View style={[styles.timingContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.timingHeader}>
                  <Feather name="clock" size={13} color={colors.primary} />
                  <Text style={[styles.timingTitle, { color: colors.primary }]}>اوقاتِ جماعت (Jama'at Times)</Text>
                </View>
                <View style={styles.timingGrid}>
                  <View style={styles.timingCell}>
                    <Text style={[styles.timingName, { color: colors.mutedForeground }]}>فجر</Text>
                    <Text style={[styles.timingVal, { color: colors.foreground }]}>{m.fajrJamaat}</Text>
                  </View>
                  <View style={styles.timingCell}>
                    <Text style={[styles.timingName, { color: colors.mutedForeground }]}>ظہر</Text>
                    <Text style={[styles.timingVal, { color: colors.foreground }]}>{m.dhuhrJamaat}</Text>
                  </View>
                  <View style={styles.timingCell}>
                    <Text style={[styles.timingName, { color: colors.mutedForeground }]}>عصر</Text>
                    <Text style={[styles.timingVal, { color: colors.foreground }]}>{m.asrJamaat}</Text>
                  </View>
                  <View style={styles.timingCell}>
                    <Text style={[styles.timingName, { color: colors.mutedForeground }]}>مغرب</Text>
                    <Text style={[styles.timingVal, { color: colors.foreground }]}>{m.maghribJamaat}</Text>
                  </View>
                  <View style={styles.timingCell}>
                    <Text style={[styles.timingName, { color: colors.mutedForeground }]}>عشاء</Text>
                    <Text style={[styles.timingVal, { color: colors.foreground }]}>{m.ishaJamaat}</Text>
                  </View>
                  <View style={[styles.timingCell, { borderRightWidth: 0 }]}>
                    <Text style={[styles.timingName, { color: colors.gold }]}>جمعہ</Text>
                    <Text style={[styles.timingVal, { color: colors.gold }]}>{m.jummahJamaat}</Text>
                  </View>
                </View>
              </View>

              {/* Amenities & Footer Actions */}
              <View style={styles.footerRow}>
                <View style={styles.amenities}>
                  {m.hasLadiesArea && (
                    <View style={[styles.tag, { backgroundColor: "#EC489918" }]}>
                      <Text style={[styles.tagText, { color: "#EC4899" }]}>خواتین</Text>
                    </View>
                  )}
                  {m.hasWuduArea && (
                    <View style={[styles.tag, { backgroundColor: "#3B82F618" }]}>
                      <Text style={[styles.tagText, { color: "#3B82F6" }]}>وضو خانہ</Text>
                    </View>
                  )}
                  {m.hasWheelchairAccess && (
                    <View style={[styles.tag, { backgroundColor: "#10B98118" }]}>
                      <Text style={[styles.tagText, { color: "#10B981" }]}>وہیل چیئر</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
                  onPress={() => openDirections(m)}
                >
                  <Feather name="navigation" size={14} color="#FFF" />
                  <Text style={styles.directionsText}>راستہ دیکھیں (Directions)</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  headerSubtitle: { fontSize: 12, color: "#FFFFFF90", marginTop: 2 },
  filterContainer: {
    padding: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  cityScroll: { gap: 8, paddingVertical: 2 },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  cityText: { fontSize: 12, fontWeight: "600" },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mosqueName: { fontSize: 16, fontWeight: "700" },
  arabicName: { fontSize: 13, marginTop: 2, fontFamily: Platform.OS === "ios" ? "Geeza Pro" : "sans-serif" },
  addressText: { fontSize: 12, marginTop: 4 },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: { fontSize: 12, fontWeight: "700" },
  timingContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  timingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timingTitle: { fontSize: 12, fontWeight: "700" },
  timingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timingCell: {
    flex: 1,
    alignItems: "center",
  },
  timingName: { fontSize: 11, fontWeight: "500" },
  timingVal: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  amenities: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 10, fontWeight: "600" },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  directionsText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14 },
});
