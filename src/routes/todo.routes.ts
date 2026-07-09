import { Router } from "express";
import { db } from "../db";
import { todos } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

// GET all todos
router.get("/", async (_req, res) => {
  const allTodos = await db.select().from(todos);
  res.json(allTodos);
});

// POST new todo
router.post("/", async (req, res) => {
  const parsed = createTodoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  
  const [newTodo] = await db
    .insert(todos)
    .values({ title: parsed.data.title, userId: (req as any).user.id })
    .returning();

  res.status(201).json(newTodo);    

});

// PATCH toggle/update todo
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, completed } = req.body;

  const [updated] = await db
    .update(todos)
    .set({ ...(title !== undefined && { title }), ...(completed !== undefined && { completed }) })
    .where(eq(todos.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Todo not found" });
  res.json(updated);
});

// DELETE todo
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(todos).where(eq(todos.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Todo not found" });
  res.status(204).send();
});

export default router;