import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetNotes, useGetBookmarks, useGetFolders, useCreateNote, useDeleteNote } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "notes" | "bookmarks" | "folders";

export default function WorkspaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("notes");
  const [showNewNote, setShowNewNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const queryClient = useQueryClient();

  const { data: notesData, isLoading: notesLoading } = useGetNotes({});
  const { data: bookmarksData, isLoading: bookmarksLoading } = useGetBookmarks({});
  const { data: foldersData, isLoading: foldersLoading } = useGetFolders();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const s = makeStyles(colors);

  const handleCreateNote = async () => {
    if (!noteTitle.trim()) return;
    await createNote.mutateAsync({ title: noteTitle, content: noteContent });
    setNoteTitle("");
    setNoteContent("");
    setShowNewNote(false);
    queryClient.invalidateQueries({ queryKey: ["/notes"] });
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert("Delete Note", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteNote.mutateAsync({ noteId: id });
        queryClient.invalidateQueries({ queryKey: ["/notes"] });
      }},
    ]);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
        <Text style={[s.title, { color: colors.foreground }]}>Workspace</Text>
        <View style={s.headerRight}>
          {tab === "notes" && (
            <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowNewNote(true)}>
              <Feather name="plus" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(["notes", "bookmarks", "folders"] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, { borderBottomColor: tab === t ? colors.primary : "transparent", borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "notes" && (
        notesLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={notesData?.notes ?? []}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[s.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.noteHeader}>
                  <Text style={[s.noteName, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                  <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
                <Text style={[s.noteContent, { color: colors.mutedForeground }]} numberOfLines={3}>{item.content}</Text>
                {item.tags && item.tags.length > 0 && (
                  <View style={s.tags}>
                    {item.tags.map(tag => (
                      <View key={tag} style={[s.tag, { backgroundColor: colors.primary + "20" }]}>
                        <Text style={[s.tagText, { color: colors.primary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={[s.noteDate, { color: colors.mutedForeground }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Feather name="file-text" size={40} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No notes yet</Text>
                <Text style={[s.emptyHint, { color: colors.mutedForeground }]}>Tap + to create your first note</Text>
              </View>
            }
          />
        )
      )}

      {tab === "bookmarks" && (
        bookmarksLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={bookmarksData?.bookmarks ?? []}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[s.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.noteHeader}>
                  <View style={[s.typeTag, { backgroundColor: colors.gold + "20" }]}>
                    <Text style={[s.typeTagText, { color: colors.gold }]}>{item.sourceType}</Text>
                  </View>
                  <Text style={[s.noteDate, { color: colors.mutedForeground }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[s.noteName, { color: colors.foreground }]}>{item.label}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Feather name="bookmark" size={40} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No bookmarks yet</Text>
                <Text style={[s.emptyHint, { color: colors.mutedForeground }]}>Bookmark ayahs and hadiths while reading</Text>
              </View>
            }
          />
        )
      )}

      {tab === "folders" && (
        foldersLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={foldersData ?? []}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[s.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.noteHeader}>
                  <Feather name="folder" size={20} color={item.color ?? colors.primary} />
                  <Text style={[s.noteName, { color: colors.foreground, flex: 1 }]}>{item.name}</Text>
                </View>
                <Text style={[s.noteDate, { color: colors.mutedForeground }]}>
                  {item.noteCount} notes · {item.bookmarkCount} bookmarks
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Feather name="folder" size={40} color={colors.mutedForeground} />
                <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No folders yet</Text>
              </View>
            }
          />
        )
      )}

      {/* New Note Modal */}
      <Modal visible={showNewNote} animationType="slide" presentationStyle="pageSheet">
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowNewNote(false)}>
              <Text style={[s.modalCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>New Note</Text>
            <TouchableOpacity onPress={handleCreateNote}>
              <Text style={[s.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={s.modalBody}>
            <TextInput
              style={[s.modalInput, { color: colors.foreground, borderBottomColor: colors.border }]}
              placeholder="Title"
              placeholderTextColor={colors.mutedForeground}
              value={noteTitle}
              onChangeText={setNoteTitle}
              fontSize={20}
            />
            <TextInput
              style={[s.modalContent, { color: colors.foreground }]}
              placeholder="Write your note..."
              placeholderTextColor={colors.mutedForeground}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    title: { fontSize: 26, fontFamily: "Inter_700Bold" },
    headerRight: { flexDirection: "row", gap: 10 },
    addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 },
    tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
    tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    noteCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
    noteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 },
    noteName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
    noteContent: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 8 },
    noteDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
    tags: { flexDirection: "row", gap: 6, marginBottom: 6, flexWrap: "wrap" },
    tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    tagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
    typeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typeTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    empty: { alignItems: "center", marginTop: 60, gap: 10 },
    emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    emptyHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    modal: { flex: 1 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
    modalCancel: { fontSize: 15, fontFamily: "Inter_400Regular" },
    modalTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    modalSave: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    modalBody: { flex: 1, padding: 16 },
    modalInput: { fontSize: 20, fontFamily: "Inter_600SemiBold", paddingBottom: 12, borderBottomWidth: 1, marginBottom: 16 },
    modalContent: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  });
}
