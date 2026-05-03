import { Router } from "express";
import { db } from "@workspace/db";
import { activityLogTable, enrollmentsTable, lessonProgressTable, notesTable, bookmarksTable, foldersTable } from "@workspace/db";
import { eq, desc, sql, gte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { LogReadingActivityBody } from "@workspace/api-zod";

const router = Router();

router.get("/progress/dashboard", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const uid = user.id;

  const [recentActivity] = await Promise.all([
    db.select().from(activityLogTable).where(eq(activityLogTable.userId, uid))
      .orderBy(desc(activityLogTable.createdAt)).limit(10),
  ]);

  const [{ completedLessons }] = await db.select({ completedLessons: sql<number>`count(*)` })
    .from(lessonProgressTable).where(eq(lessonProgressTable.userId, uid));

  const [{ enrolledPaths }] = await db.select({ enrolledPaths: sql<number>`count(*)` })
    .from(enrollmentsTable).where(eq(enrollmentsTable.userId, uid));

  const [{ totalMinutes }] = await db.select({ totalMinutes: sql<number>`coalesce(sum(${activityLogTable.durationMinutes}), 0)` })
    .from(activityLogTable).where(eq(activityLogTable.userId, uid));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklyData = await db.select({
    date: sql<string>`date_trunc('day', ${activityLogTable.createdAt})`,
    minutes: sql<number>`coalesce(sum(${activityLogTable.durationMinutes}), 0)`,
  }).from(activityLogTable)
    .where(sql`${activityLogTable.userId} = ${uid} AND ${activityLogTable.createdAt} >= ${sevenDaysAgo}`)
    .groupBy(sql`date_trunc('day', ${activityLogTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${activityLogTable.createdAt})`);

  const weeklyReadingMinutes = Array(7).fill(0);
  weeklyData.forEach(d => {
    const dayIndex = Math.floor((new Date().getTime() - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex >= 0 && dayIndex < 7) weeklyReadingMinutes[6 - dayIndex] = Number(d.minutes);
  });

  res.json({
    readingStreak: await calculateStreak(uid),
    totalReadingMinutes: Number(totalMinutes),
    completedLessons: Number(completedLessons),
    enrolledPaths: Number(enrolledPaths),
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      timestamp: a.createdAt,
    })),
    weeklyReadingMinutes,
  });
});

router.get("/progress/reading-streak", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const current = await calculateStreak(user.id);
  const [lastActivity] = await db.select().from(activityLogTable)
    .where(eq(activityLogTable.userId, user.id))
    .orderBy(desc(activityLogTable.createdAt)).limit(1);
  res.json({ current, longest: current, lastReadAt: lastActivity?.createdAt ?? null });
});

router.post("/progress/log", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = LogReadingActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const { type, sourceId, durationMinutes } = parsed.data;
  const descriptions: Record<string, string> = {
    quran_read: "Read Quran",
    hadith_read: "Read Hadith",
    book_read: "Read a book",
  };
  await db.insert(activityLogTable).values({
    userId: user.id,
    type,
    sourceId,
    description: descriptions[type] || "Reading session",
    durationMinutes,
  });
  res.json({ message: "Activity logged" });
});

router.get("/users/stats", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const uid = user.id;
  const [[{ totalNotes }], [{ totalBookmarks }], [{ totalFolders }], [{ enrolledPaths }], [{ completedLessons }], [{ totalReadingMinutes }]] = await Promise.all([
    db.select({ totalNotes: sql<number>`count(*)` }).from(notesTable).where(eq(notesTable.userId, uid)),
    db.select({ totalBookmarks: sql<number>`count(*)` }).from(bookmarksTable).where(eq(bookmarksTable.userId, uid)),
    db.select({ totalFolders: sql<number>`count(*)` }).from(foldersTable).where(eq(foldersTable.userId, uid)),
    db.select({ enrolledPaths: sql<number>`count(*)` }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, uid)),
    db.select({ completedLessons: sql<number>`count(*)` }).from(lessonProgressTable).where(eq(lessonProgressTable.userId, uid)),
    db.select({ totalReadingMinutes: sql<number>`coalesce(sum(${activityLogTable.durationMinutes}), 0)` }).from(activityLogTable).where(eq(activityLogTable.userId, uid)),
  ]);
  res.json({
    totalNotes: Number(totalNotes),
    totalBookmarks: Number(totalBookmarks),
    totalFolders: Number(totalFolders),
    enrolledPaths: Number(enrolledPaths),
    completedLessons: Number(completedLessons),
    readingStreak: await calculateStreak(uid),
    totalReadingMinutes: Number(totalReadingMinutes),
  });
});

async function calculateStreak(userId: string): Promise<number> {
  const activities = await db.select({ date: sql<string>`date_trunc('day', ${activityLogTable.createdAt})` })
    .from(activityLogTable).where(eq(activityLogTable.userId, userId))
    .groupBy(sql`date_trunc('day', ${activityLogTable.createdAt})`)
    .orderBy(desc(sql`date_trunc('day', ${activityLogTable.createdAt})`));
  if (activities.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < activities.length; i++) {
    const actDate = new Date(activities[i].date);
    actDate.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (actDate.getTime() === expected.getTime()) streak++;
    else break;
  }
  return streak;
}

export default router;
