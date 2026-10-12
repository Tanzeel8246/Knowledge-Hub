import { mysqlTable, text, varchar, int, timestamp, decimal, mysqlEnum, index } from "drizzle-orm/mysql-core";
import crypto from "crypto";
import { usersTable } from "./users";

export const learningPathsTable = mysqlTable("learning_paths", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced"]).notNull(),
  topic: varchar("topic", { length: 128 }).notNull(),
  totalLessons: int("total_lessons").notNull().default(0),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 1 }).notNull(),
  coverUrl: text("cover_url"),
  enrolledCount: int("enrolled_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessonsTable = mysqlTable("lessons", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  pathId: varchar("path_id", { length: 36 }).notNull().references(() => learningPathsTable.id, { onDelete: "cascade" }),
  lessonNumber: int("lesson_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  estimatedMinutes: int("estimated_minutes").notNull().default(30),
  references: text("references").notNull().default("[]"),
}, (table) => [
  index("lessons_path_idx").on(table.pathId),
]);

export const enrollmentsTable = mysqlTable("enrollments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  pathId: varchar("path_id", { length: 36 }).notNull().references(() => learningPathsTable.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  progressPercent: decimal("progress_percent", { precision: 5, scale: 2 }).notNull().default("0"),
}, (table) => [
  index("enrollments_user_idx").on(table.userId),
]);

export const lessonProgressTable = mysqlTable("lesson_progress", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id", { length: 36 }).notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  pathId: varchar("path_id", { length: 36 }).notNull().references(() => learningPathsTable.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (table) => [
  index("lesson_progress_user_idx").on(table.userId, table.pathId),
]);

export type LearningPath = typeof learningPathsTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;
