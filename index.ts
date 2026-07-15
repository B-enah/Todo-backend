import express from "express";
import authRoutes from "./src/routes/auth.routes";
import todoRoutes from "./src/routes/todo.routes";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "todo-backend running" });
});

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));