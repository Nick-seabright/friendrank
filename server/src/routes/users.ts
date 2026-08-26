import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../auth";

const router = Router();

const pushTokenSchema = z.object({ pushToken: z.string().min(1) });

router.post("/push-token", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = pushTokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await prisma.user.update({
    where: { id: req.userId },
    data: { pushToken: parsed.data.pushToken },
  });
  res.json({ ok: true });
});

export default router;
