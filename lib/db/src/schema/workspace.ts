import { mysqlTable, text, varchar, int, timestamp, mysqlEnum, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";
import { usersTable } from "./users";

export const foldersTable = mysqlTable("folders", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 32 }),
  icon: varchar("icon", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("folders_user_idx").on(table.userId),
]);

export const notesTable = mysqlTable("notes", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  folderId: varchar("folder_id", { length: 36 }).references(() => foldersTable.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  sourceType: mysqlEnum("source_type", ["quran", "hadith", "book", "general"]),
  sourceId: varchar("source_id", { length: 128 }),
  sourceLabel: varchar("source_label", { length: 255 }),
  tags: text("tags").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("notes_user_idx").on(table.userId),
  index("notes_folder_idx").on(table.folderId),
]);

export const bookmarksTable = mysqlTable("bookmarks", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  folderId: varchar("folder_id", { length: 36 }).references(() => foldersTable.id, { onDelete: "set null" }),
  sourceType: mysqlEnum("source_type", ["quran", "hadith", "book"]).notNull(),
  sourceId: varchar("source_id", { length: 128 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("bookmarks_user_idx").on(table.userId),
]);

export const activityLogTable = mysqlTable("activity_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["quran_read", "hadith_read", "book_read", "lesson_completed", "note_created"]).notNull(),
  sourceId: varchar("source_id", { length: 128 }),
  description: varchar("description", { length: 512 }).notNull(),
  durationMinutes: int("duration_minutes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("activity_user_idx").on(table.userId),
  index("activity_date_idx").on(table.createdAt),
]);

export type Folder = typeof foldersTable.$inferSelect;
export type Note = typeof notesTable.$inferSelect;
export type Bookmark = typeof bookmarksTable.$inferSelect;
export type ActivityLog = typeof activityLogTable.$inferSelect;
