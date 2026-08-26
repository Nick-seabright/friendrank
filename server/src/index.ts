import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import presetRoutes from "./routes/presets";
import groupRoutes from "./routes/groups";
import pointRoutes from "./routes/points";
import { startAutoAcceptJob } from "./jobs/autoAccept";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/presets", presetRoutes);
app.use("/groups", groupRoutes);
app.use("/points", pointRoutes);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`FriendRank server listening on http://0.0.0.0:${PORT}`);
  startAutoAcceptJob();
});
