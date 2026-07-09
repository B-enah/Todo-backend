import express from "express";
import cors from "cors";
import todosRouter from "./src/routes/todo.routes";
import authRoutes from "./src/routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/todos", todosRouter);

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
