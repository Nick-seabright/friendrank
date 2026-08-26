import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const presets = await prisma.preset.findMany({ orderBy: [{ polarity: "asc" }, { defaultValue: "desc" }] });
  res.json(presets);
});

export default router;
