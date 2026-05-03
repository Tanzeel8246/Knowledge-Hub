import { pgTable, text, integer, uuid, boolean, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const learningPathsTable = pgTable("learning_paths", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  topic: text("topic").notNull(),
  totalLessons: integer("total_lessons").notNull().default(0),
  estimatedHours: numeric("estimated_hours", { precision: 5, scale: 1 }).notNull(),
  coverUrl: text("cover_url"),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessonsTable = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  pathId: uuid("path_id").notNull().references(() => learningPathsTable.id, { onDelete: "cascade" }),
  lessonNumber: integer("lesson_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  references: text("references").notNull().default("[]"),
}, (table) => [
  index("lessons_path_idx").on(table.pathId),
]);

export const enrollmentsTable = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  pathId: uuid("path_id").notNull().references(() => learningPathsTable.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  progressPercent: numeric("progress_percent", { precision: 5, scale: 2 }).notNull().default("0"),
}, (table) => [
  index("enrollments_user_idx").on(table.userId),
]);

export const lessonProgressTable = pgTable("lesson_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  pathId: uuid("path_id").notNull().references(() => learningPathsTable.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (table) => [
  index("lesson_progress_user_idx").on(table.userId, table.pathId),
]);

export type LearningPath = typeof learningPathsTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;
