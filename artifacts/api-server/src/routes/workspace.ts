import { Router } from "express";
import { db } from "@workspace/db";
import { notesTable, bookmarksTable, foldersTable, activityLogTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CreateNoteBody, UpdateNoteBody, GetNotesQueryParams, CreateBookmarkBody, GetBookmarksQueryParams, CreateFolderBody, UpdateFolderBody } from "@workspace/api-zod";

const router = Router();

// ─── Notes ───────────────────────────────────────────────────────────────────
router.get("/notes", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = GetNotesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query" });
    return;
  }
  const { folderId, sourceType, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const conditions = [eq(notesTable.userId, user.id)];
  if (folderId) conditions.push(eq(notesTable.folderId, folderId));
  if (sourceType) conditions.push(eq(notesTable.sourceType, sourceType));
  const notes = await db.select().from(notesTable).where(and(...conditions)).limit(limit).offset(offset).orderBy(notesTable.updatedAt);
  const parsedNotes = notes.map(n => ({ ...n, tags: JSON.parse(n.tags) }));
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(notesTable).where(and(...conditions));
  const total = Number(count);
  res.json({ notes: parsedNotes, total, page, totalPages: Math.ceil(total / limit) });
});

router.post("/notes", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const { tags = [], ...rest } = parsed.data;
  const insertResult = await db.insert(notesTable).values({
    userId: user.id,
    ...rest,
    tags: JSON.stringify(tags),
  });
  const [note] = await db.select().from(notesTable).where(eq(notesTable.id, insertResult[0].insertId)).limit(1);
  await db.insert(activityLogTable).values({
    userId: user.id, type: "note_created", sourceId: note.id, description: `Created note: ${note.title}`, durationMinutes: 0,
  });
  res.status(201).json({ ...note, tags });
});

router.get("/notes/:noteId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [note] = await db.select().from(notesTable)
    .where(and(eq(notesTable.id, req.params.noteId), eq(notesTable.userId, user.id))).limit(1);
  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }
  res.json({ ...note, tags: JSON.parse(note.tags) });
});

router.patch("/notes/:noteId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const { tags, ...rest } = parsed.data;
  const updateData: Record<string, any> = { ...rest, updatedAt: new Date() };
  if (tags !== undefined) updateData.tags = JSON.stringify(tags);
  await db.update(notesTable).set(updateData)
    .where(and(eq(notesTable.id, req.params.noteId), eq(notesTable.userId, user.id)));
  const [note] = await db.select().from(notesTable).where(and(eq(notesTable.id, req.params.noteId), eq(notesTable.userId, user.id))).limit(1);
  if (!note) {
    res.status(404).json({ message: "Note not found" });
    return;
  }
  res.json({ ...note, tags: JSON.parse(note.tags) });
});

router.delete("/notes/:noteId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  await db.delete(notesTable).where(and(eq(notesTable.id, req.params.noteId), eq(notesTable.userId, user.id)));
  res.json({ message: "Note deleted" });
});

// ─── Bookmarks ────────────────────────────────────────────────────────────────
router.get("/bookmarks", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = GetBookmarksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query" });
    return;
  }
  const { sourceType, folderId, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const conditions = [eq(bookmarksTable.userId, user.id)];
  if (sourceType) conditions.push(eq(bookmarksTable.sourceType, sourceType));
  if (folderId) conditions.push(eq(bookmarksTable.folderId, folderId));
  const bookmarks = await db.select().from(bookmarksTable).where(and(...conditions)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(bookmarksTable).where(and(...conditions));
  const total = Number(count);
  res.json({ bookmarks, total, page, totalPages: Math.ceil(total / limit) });
});

router.post("/bookmarks", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = CreateBookmarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const insertResult = await db.insert(bookmarksTable).values({ userId: user.id, ...parsed.data });
  const [bookmark] = await db.select().from(bookmarksTable).where(eq(bookmarksTable.id, insertResult[0].insertId)).limit(1);
  res.status(201).json(bookmark);
});

router.delete("/bookmarks/:bookmarkId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  await db.delete(bookmarksTable).where(and(eq(bookmarksTable.id, req.params.bookmarkId), eq(bookmarksTable.userId, user.id)));
  res.json({ message: "Bookmark deleted" });
});

// ─── Folders ──────────────────────────────────────────────────────────────────
router.get("/folders", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const folders = await db.select({
    id: foldersTable.id,
    userId: foldersTable.userId,
    name: foldersTable.name,
    color: foldersTable.color,
    icon: foldersTable.icon,
    createdAt: foldersTable.createdAt,
    noteCount: sql<number>`(select count(*) from ${notesTable} where ${notesTable.folderId} = ${foldersTable.id})`,
    bookmarkCount: sql<number>`(select count(*) from ${bookmarksTable} where ${bookmarksTable.folderId} = ${foldersTable.id})`,
  }).from(foldersTable).where(eq(foldersTable.userId, user.id));
  res.json(folders);
});

router.post("/folders", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = CreateFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const insertResult = await db.insert(foldersTable).values({ userId: user.id, ...parsed.data });
  const [folder] = await db.select().from(foldersTable).where(eq(foldersTable.id, insertResult[0].insertId)).limit(1);
  res.status(201).json({ ...folder, noteCount: 0, bookmarkCount: 0 });
});

router.get("/folders/:folderId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [folder] = await db.select().from(foldersTable)
    .where(and(eq(foldersTable.id, req.params.folderId), eq(foldersTable.userId, user.id))).limit(1);
  if (!folder) {
    res.status(404).json({ message: "Folder not found" });
    return;
  }
  const notes = await db.select().from(notesTable).where(and(eq(notesTable.folderId, folder.id), eq(notesTable.userId, user.id)));
  const bookmarks = await db.select().from(bookmarksTable).where(and(eq(bookmarksTable.folderId, folder.id), eq(bookmarksTable.userId, user.id)));
  res.json({ ...folder, noteCount: notes.length, bookmarkCount: bookmarks.length, notes: notes.map(n => ({ ...n, tags: JSON.parse(n.tags) })), bookmarks });
});

router.patch("/folders/:folderId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = UpdateFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  await db.update(foldersTable).set(parsed.data)
    .where(and(eq(foldersTable.id, req.params.folderId), eq(foldersTable.userId, user.id)));
  const [folder] = await db.select().from(foldersTable).where(and(eq(foldersTable.id, req.params.folderId), eq(foldersTable.userId, user.id))).limit(1);
  if (!folder) {
    res.status(404).json({ message: "Folder not found" });
    return;
  }
  res.json({ ...folder, noteCount: 0, bookmarkCount: 0 });
});

router.delete("/folders/:folderId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  await db.delete(foldersTable).where(and(eq(foldersTable.id, req.params.folderId), eq(foldersTable.userId, user.id)));
  res.json({ message: "Folder deleted" });
});

export default router;
