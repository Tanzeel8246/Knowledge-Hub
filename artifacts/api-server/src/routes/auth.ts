import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signToken, requireAuth } from "../lib/auth";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const { name, email, password, language } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }
  const passwordHash = await hashPassword(password);
  await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    language: language ?? "en",
  });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const token = signToken(user.id, user.role);
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({ user: safeUser, token });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }
  const token = signToken(user.id, user.role);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
