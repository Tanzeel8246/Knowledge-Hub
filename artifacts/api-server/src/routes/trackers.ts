import { Router } from "express";
import { db, prayerLogsTable, hifzTrackerTable, fastingTrackerTable, tasbihTrackerTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// ================= PRAYER TRACKER =================
router.get("/trackers/prayer", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  
  const [log] = await db.select().from(prayerLogsTable)
    .where(and(eq(prayerLogsTable.userId, user.id), eq(prayerLogsTable.date, date)))
    .limit(1);
    
  res.json({
    date,
    log: log || {
      fajr: "unrecorded",
      dhuhr: "unrecorded",
      asr: "unrecorded",
      maghrib: "unrecorded",
      isha: "unrecorded",
      notes: "",
    }
  });
});

router.post("/trackers/prayer", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { date, fajr, dhuhr, asr, maghrib, isha, notes } = req.body;
  const logDate = date || new Date().toISOString().slice(0, 10);

  const existing = await db.select().from(prayerLogsTable)
    .where(and(eq(prayerLogsTable.userId, user.id), eq(prayerLogsTable.date, logDate)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(prayerLogsTable)
      .set({
        fajr: fajr ?? existing[0].fajr,
        dhuhr: dhuhr ?? existing[0].dhuhr,
        asr: asr ?? existing[0].asr,
        maghrib: maghrib ?? existing[0].maghrib,
        isha: isha ?? existing[0].isha,
        notes: notes !== undefined ? notes : existing[0].notes,
        updatedAt: new Date(),
      })
      .where(eq(prayerLogsTable.id, existing[0].id));
  } else {
    await db.insert(prayerLogsTable).values({
      userId: user.id,
      date: logDate,
      fajr: fajr || "unrecorded",
      dhuhr: dhuhr || "unrecorded",
      asr: asr || "unrecorded",
      maghrib: maghrib || "unrecorded",
      isha: isha || "unrecorded",
      notes: notes || "",
    });
  }

  const [saved] = await db.select().from(prayerLogsTable)
    .where(and(eq(prayerLogsTable.userId, user.id), eq(prayerLogsTable.date, logDate)))
    .limit(1);

  res.json({ success: true, log: saved });
});

// ================= HIFZ TRACKER =================
router.get("/trackers/hifz", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const records = await db.select().from(hifzTrackerTable)
    .where(eq(hifzTrackerTable.userId, user.id))
    .orderBy(hifzTrackerTable.surahNumber);
  res.json({ records });
});

router.post("/trackers/hifz", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { surahNumber, startAyah = 1, endAyah, status = "memorizing" } = req.body;

  if (!surahNumber || !endAyah) {
    res.status(400).json({ message: "surahNumber and endAyah are required" });
    return;
  }

  const [existing] = await db.select().from(hifzTrackerTable)
    .where(and(eq(hifzTrackerTable.userId, user.id), eq(hifzTrackerTable.surahNumber, Number(surahNumber))))
    .limit(1);

  if (existing) {
    await db.update(hifzTrackerTable)
      .set({
        startAyah: Number(startAyah),
        endAyah: Number(endAyah),
        status,
        lastRevisedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hifzTrackerTable.id, existing.id));
  } else {
    await db.insert(hifzTrackerTable).values({
      userId: user.id,
      surahNumber: Number(surahNumber),
      startAyah: Number(startAyah),
      endAyah: Number(endAyah),
      status,
      lastRevisedAt: new Date(),
    });
  }

  const [record] = await db.select().from(hifzTrackerTable)
    .where(and(eq(hifzTrackerTable.userId, user.id), eq(hifzTrackerTable.surahNumber, Number(surahNumber))))
    .limit(1);

  res.json({ success: true, record });
});

// ================= FASTING TRACKER =================
router.get("/trackers/fasting", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const records = await db.select().from(fastingTrackerTable)
    .where(eq(fastingTrackerTable.userId, user.id))
    .orderBy(desc(fastingTrackerTable.date))
    .limit(50);
  res.json({ records });
});

router.post("/trackers/fasting", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { date, fastType = "voluntary", status = "fasted", notes } = req.body;
  const logDate = date || new Date().toISOString().slice(0, 10);

  const [existing] = await db.select().from(fastingTrackerTable)
    .where(and(eq(fastingTrackerTable.userId, user.id), eq(fastingTrackerTable.date, logDate)))
    .limit(1);

  if (existing) {
    await db.update(fastingTrackerTable)
      .set({ fastType, status, notes: notes ?? existing.notes })
      .where(eq(fastingTrackerTable.id, existing.id));
  } else {
    await db.insert(fastingTrackerTable).values({
      userId: user.id,
      date: logDate,
      fastType,
      status,
      notes: notes || "",
    });
  }

  const [record] = await db.select().from(fastingTrackerTable)
    .where(and(eq(fastingTrackerTable.userId, user.id), eq(fastingTrackerTable.date, logDate)))
    .limit(1);

  res.json({ success: true, record });
});

// ================= TASBIH TRACKER =================
router.get("/trackers/tasbih", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const records = await db.select().from(tasbihTrackerTable)
    .where(eq(tasbihTrackerTable.userId, user.id))
    .orderBy(desc(tasbihTrackerTable.createdAt))
    .limit(30);
  res.json({ records });
});

router.post("/trackers/tasbih", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { dhikrText, count = 33, target = 33, date } = req.body;

  if (!dhikrText) {
    res.status(400).json({ message: "dhikrText is required" });
    return;
  }

  await db.insert(tasbihTrackerTable).values({
    userId: user.id,
    dhikrText,
    count: Number(count),
    target: Number(target),
    date: date || new Date().toISOString().slice(0, 10),
  });

  res.json({ success: true });
});

export default router;
