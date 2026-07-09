import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { registerSchema, loginSchema } from "../../validators/auth.validators";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";

const router = Router();

function tokensFor(user: { id: number; email: string }) {
  const payload = { userId: user.id, email: user.email };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  if (await db.query.users.findFirst({ where: eq(users.email, email) }))
    return res.status(409).json({ error: "Email already registered" });

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: await hashPassword(password) })
    .returning({ id: users.id, email: users.email });

  if (!user) {
    return res.status(500).json({ error: "Failed to create user" });
  }
  
  res.status(201).json({ user, ...tokensFor(user) });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return res.status(401).json({ error: "Invalid email or password" });

  res.json({ user: { id: user.id, email: user.email }, ...tokensFor(user) });
});

router.post("/refresh", async (req, res) => {
  if (!req.body.refreshToken) return res.status(400).json({ error: "refreshToken is required" });

  try {
    const { userId, email } = verifyRefreshToken(req.body.refreshToken);
    res.json({ accessToken: signAccessToken({ userId, email }) });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

export default router;