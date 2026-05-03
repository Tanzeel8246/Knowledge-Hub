import { pgTable, text, integer, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const foldersTable = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("folders_user_idx").on(table.userId),
]);

export const notesTable = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => foldersTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceType: text("source_type", { enum: ["quran", "hadith", "book", "general"] }),
  sourceId: text("source_id"),
  sourceLabel: text("source_label"),
  tags: text("tags").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("notes_user_idx").on(table.userId),
  index("notes_folder_idx").on(table.folderId),
]);

export const bookmarksTable = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => foldersTable.id, { onDelete: "set null" }),
  sourceType: text("source_type", { enum: ["quran", "hadith", "book"] }).notNull(),
  sourceId: text("source_id").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("bookmarks_user_idx").on(table.userId),
]);

export const activityLogTable = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["quran_read", "hadith_read", "book_read", "lesson_completed", "note_created"] }).notNull(),
  sourceId: text("source_id"),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("activity_user_idx").on(table.userId),
  index("activity_date_idx").on(table.createdAt),
]);

export type Folder = typeof foldersTable.$inferSelect;
export type Note = typeof notesTable.$inferSelect;
export type Bookmark = typeof bookmarksTable.$inferSelect;
export type ActivityLog = typeof activityLogTable.$inferSelect;
