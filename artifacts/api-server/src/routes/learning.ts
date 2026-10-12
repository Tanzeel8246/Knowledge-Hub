import { Router } from "express";
import { db } from "@workspace/db";
import {
  learningPathsTable, lessonsTable, enrollmentsTable, lessonProgressTable, activityLogTable, usersTable
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { GetLearningPathsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/learning/paths", async (req, res) => {
  const parsed = GetLearningPathsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query" });
    return;
  }
  const { level, topic } = parsed.data;
  const conditions = [];
  if (level) conditions.push(eq(learningPathsTable.level, level));
  if (topic) conditions.push(eq(learningPathsTable.topic, topic));
  const paths = await db.select().from(learningPathsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  res.json(paths);
});

router.get("/learning/paths/:pathId", async (req, res) => {
  const [path] = await db.select().from(learningPathsTable)
    .where(eq(learningPathsTable.id, req.params.pathId)).limit(1);
  if (!path) {
    res.status(404).json({ message: "Learning path not found" });
    return;
  }
  const lessons = await db.select({
    id: lessonsTable.id,
    lessonNumber: lessonsTable.lessonNumber,
    title: lessonsTable.title,
    estimatedMinutes: lessonsTable.estimatedMinutes,
  }).from(lessonsTable).where(eq(lessonsTable.pathId, path.id)).orderBy(lessonsTable.lessonNumber);
  res.json({ ...path, lessons });
});

router.post("/learning/paths/:pathId/enroll", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const pathId = req.params.pathId;
  const [path] = await db.select().from(learningPathsTable).where(eq(learningPathsTable.id, pathId)).limit(1);
  if (!path) {
    res.status(404).json({ message: "Learning path not found" });
    return;
  }
  const [existing] = await db.select().from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, user.id), eq(enrollmentsTable.pathId, pathId))).limit(1);
  if (existing) {
    res.json(existing);
    return;
  }
  await db.insert(enrollmentsTable).values({ userId: user.id, pathId });
  const [enrollment] = await db.select().from(enrollmentsTable).where(and(eq(enrollmentsTable.userId, user.id), eq(enrollmentsTable.pathId, pathId))).limit(1);
  await db.update(learningPathsTable).set({ enrolledCount: sql`${learningPathsTable.enrolledCount} + 1` }).where(eq(learningPathsTable.id, pathId));
  res.json(enrollment);
});

router.get("/learning/paths/:pathId/lessons/:lessonId", async (req, res) => {
  const [lesson] = await db.select().from(lessonsTable)
    .where(and(eq(lessonsTable.id, req.params.lessonId), eq(lessonsTable.pathId, req.params.pathId))).limit(1);
  if (!lesson) {
    res.status(404).json({ message: "Lesson not found" });
    return;
  }
  let references = [];
  try { references = JSON.parse(lesson.references); } catch {}
  res.json({ ...lesson, references });
});

router.post("/learning/paths/:pathId/lessons/:lessonId/complete", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { pathId, lessonId } = req.params;
  const [existing] = await db.select().from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.lessonId, lessonId))).limit(1);
  if (!existing) {
    await db.insert(lessonProgressTable).values({ userId: user.id, lessonId, pathId });
    await db.insert(activityLogTable).values({
      userId: user.id,
      type: "lesson_completed",
      sourceId: lessonId,
      description: "Completed a lesson",
      durationMinutes: 0,
    });
    const [totalLessons] = await db.select({ count: sql<number>`count(*)` }).from(lessonsTable).where(eq(lessonsTable.pathId, pathId));
    const [completedCount] = await db.select({ count: sql<number>`count(*)` }).from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.pathId, pathId)));
    const progress = Math.round((Number(completedCount.count) / Number(totalLessons.count)) * 100);
    await db.update(enrollmentsTable).set({ progressPercent: String(progress) })
      .where(and(eq(enrollmentsTable.userId, user.id), eq(enrollmentsTable.pathId, pathId)));
  }
  res.json({ lessonId, completed: true, completedAt: new Date() });
});

router.get("/learning/my-paths", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.userId, user.id));
  const result = await Promise.all(enrollments.map(async (e) => {
    const [path] = await db.select().from(learningPathsTable).where(eq(learningPathsTable.id, e.pathId)).limit(1);
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.pathId, e.pathId)));
    return { ...e, path, completedLessons: Number(count) };
  }));
  res.json(result);
});

export default router;
