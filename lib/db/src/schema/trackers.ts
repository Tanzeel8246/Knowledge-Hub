import { mysqlTable, text, varchar, int, timestamp, mysqlEnum, boolean, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";
import { usersTable } from "./users";

export const prayerLogsTable = mysqlTable("prayer_logs", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  fajr: mysqlEnum("fajr", ["prayed_jamaah", "prayed_alone", "missed", "qadha", "unrecorded"]).notNull().default("unrecorded"),
  dhuhr: mysqlEnum("dhuhr", ["prayed_jamaah", "prayed_alone", "missed", "qadha", "unrecorded"]).notNull().default("unrecorded"),
  asr: mysqlEnum("asr", ["prayed_jamaah", "prayed_alone", "missed", "qadha", "unrecorded"]).notNull().default("unrecorded"),
  maghrib: mysqlEnum("maghrib", ["prayed_jamaah", "prayed_alone", "missed", "qadha", "unrecorded"]).notNull().default("unrecorded"),
  isha: mysqlEnum("isha", ["prayed_jamaah", "prayed_alone", "missed", "qadha", "unrecorded"]).notNull().default("unrecorded"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("prayer_logs_user_date_idx").on(table.userId, table.date),
]);

export const hifzTrackerTable = mysqlTable("hifz_tracker", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  surahNumber: int("surah_number").notNull(),
  startAyah: int("start_ayah").notNull().default(1),
  endAyah: int("end_ayah").notNull(),
  status: mysqlEnum("status", ["not_started", "memorizing", "memorized", "revising"]).notNull().default("not_started"),
  lastRevisedAt: timestamp("last_revised_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("hifz_user_surah_idx").on(table.userId, table.surahNumber),
]);

export const fastingTrackerTable = mysqlTable("fasting_tracker", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  fastType: varchar("fast_type", { length: 64 }).notNull().default("ramadan"),
  status: mysqlEnum("status", ["fasted", "missed", "partial", "exempt"]).notNull().default("fasted"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("fasting_user_date_idx").on(table.userId, table.date),
]);

export const tasbihTrackerTable = mysqlTable("tasbih_tracker", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  dhikrText: varchar("dhikr_text", { length: 255 }).notNull(),
  count: int("count").notNull().default(0),
  target: int("target").notNull().default(33),
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("tasbih_user_date_idx").on(table.userId, table.date),
]);

export type PrayerLog = typeof prayerLogsTable.$inferSelect;
export type HifzRecord = typeof hifzTrackerTable.$inferSelect;
export type FastingRecord = typeof fastingTrackerTable.$inferSelect;
export type TasbihRecord = typeof tasbihTrackerTable.$inferSelect;
