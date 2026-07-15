import { Router } from "express";
import { db } from "../db";
import { todos } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

router.use(authenticate); // every route below requires a valid access token

const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

// GET all todos — only this user's
router.get("/", async (req, res) => {
  const userTodos = await db.select().from(todos).where(eq(todos.userId, req.user!.userId));
  res.json(userTodos);
});

// POST new todo
router.post("/", async (req, res) => {
  const parsed = createTodoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const [newTodo] = await db
    .insert(todos)
    .values({ title: parsed.data.title, userId: req.user!.userId })
    .returning();

  res.status(201).json(newTodo);
});

// PATCH toggle/update todo — only if it belongs to this user
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, completed } = req.body;

  const [updated] = await db
    .update(todos)
    .set({ ...(title !== undefined && { title }), ...(completed !== undefined && { completed }) })
    .where(and(eq(todos.id, id), eq(todos.userId, req.user!.userId)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Todo not found" });
  res.json(updated);
});

// DELETE todo — only if it belongs to this user
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  const [deleted] = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, req.user!.userId)))
    .returning();

  if (!deleted) return res.status(404).json({ error: "Todo not found" });
  res.status(204).send();
});

export default router;