import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetHadithBooks, useGetHadithCollections } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useOfflineDownload } from "@/hooks/useOfflineDownload";
import { FALLBACK_HADITH_COLLECTIONS, FALLBACK_HADITH_BOOKS, HadithBook } from "@/constants/hadithData";
import { fetchCollectionBooks } from "@/lib/openIslamicApi";

export default function HadithCollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const { data: books, isLoading } = useGetHadithBooks(collectionId);
  const { data: collections } = useGetHadithCollections();
  const collection = collections?.find(c => c.id === collectionId) ?? FALLBACK_HADITH_COLLECTIONS.find(c => c.id === collectionId);
  const { downloadHadithCollection, deleteDownload, getStatus, getProgress, getCollectionKey, getHadithCollectionOffline } = useOfflineDownload();
  const [offlineData, setOfflineData] = React.useState<{ collection: any; books: HadithBook[]; hadiths: any[] } | null>(null);
  const [cdnBooks, setCdnBooks] = React.useState<HadithBook[]>([]);

  React.useEffect(() => {
    if (collectionId) {
      getHadithCollectionOffline<{ collection: any; books: HadithBook[]; hadiths: any[] }>(collectionId).then(data => {
        if (data && data.books && data.books.length > 0) setOfflineData(data);
      });
      fetchCollectionBooks(collectionId).then(list => {
        if (list && list.length > 0) setCdnBooks(list);
      });
    }
  }, [collectionId]);

  const fallbackBooks = FALLBACK_HADITH_BOOKS[collectionId ?? ""] ?? [];
  const displayBooks = (cdnBooks.length > 0)
    ? cdnBooks
    : (offlineData?.books && offlineData.books.length > 0)
    ? offlineData.books
    : (books && books.length > 0)
    ? books
    : fallbackBooks;
  const colKey = getCollectionKey(collectionId ?? "");
  const offlineStatus = getStatus(colKey);
  const offlineProg = getProgress(colKey);

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.title, { color: colors.foreground }]} numberOfLines={1}>{collection?.name ?? collectionId}</Text>
          {collection?.nameArabic && <Text style={[s.arabic, { color: colors.gold }]}>{collection.nameArabic}</Text>}
        </View>
        <TouchableOpacity
          style={[s.offlineBtn, {
            backgroundColor: offlineStatus === "done" ? "#16A34A20" : colors.primary + "15",
            borderColor: offlineStatus === "done" ? "#16A34A40" : colors.primary + "30",
          }]}
          onPress={() => {
            if (offlineStatus === "done") {
              deleteDownload(colKey);
            } else if (offlineStatus !== "downloading" && collectionId) {
              downloadHadithCollection(collectionId, collection?.name ?? collectionId, collection?.nameArabic ?? undefined);
            }
          }}
        >
          {offlineStatus === "downloading" ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : offlineStatus === "done" ? (
            <Feather name="check-circle" size={16} color="#16A34A" />
          ) : (
            <Feather name="download" size={16} color={colors.primary} />
          )}
          <Text style={[s.offlineBtnText, { color: offlineStatus === "done" ? "#16A34A" : colors.primary }]}>
            {offlineStatus === "done" ? "Offline" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
      {offlineStatus === "downloading" && (
        <View style={[s.progressBar, { backgroundColor: colors.border }]}>
          <View style={[s.progressFill, { width: `${Math.round(offlineProg * 100)}%` as any, backgroundColor: colors.primary }]} />
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayBooks}
          keyExtractor={item => `${item.collectionId}-${item.bookNumber}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.bookItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/hadith/${collectionId}/${item.bookNumber}` as any)}
            >
              <View style={[s.bookNum, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[s.bookNumText, { color: colors.primary }]}>{item.bookNumber}</Text>
              </View>
              <View style={s.bookInfo}>
                <Text style={[s.bookName, { color: colors.foreground }]}>{item.nameEnglish ?? `Book ${item.bookNumber}`}</Text>
                {item.nameArabic && <Text style={[s.bookArabic, { color: colors.gold }]}>{item.nameArabic}</Text>}
                <Text style={[s.bookCount, { color: colors.mutedForeground }]}>{item.totalHadiths} hadiths</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No books available</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 14 },
    headerCenter: { flex: 1 },
    title: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
    arabic: { fontSize: 14 },
    bookItem: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, gap: 14 },
    bookNum: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    bookNumText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    bookInfo: { flex: 1 },
    bookName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
    bookArabic: { fontSize: 13, marginBottom: 2 },
    bookCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
    empty: { alignItems: "center", marginTop: 60 },
    emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
    offlineBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    offlineBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    progressBar: { height: 3, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2 },
  });
}
