import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { UpdateProfileBody } from "@workspace/api-zod";

const router = Router();

router.patch("/users/profile", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const [updated] = await db.update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();
  const { passwordHash: _, ...safeUser } = updated;
  res.json(safeUser);
});

export default router;
