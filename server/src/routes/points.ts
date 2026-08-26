import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../auth";
import { sendPush } from "../push";

const router = Router();

async function isMember(groupId: string, userId: string) {
  const m = await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  return !!m;
}

const logPointSchema = z.object({
  groupId: z.string(),
  recipientId: z.string(),
  presetId: z.string(),
  customValue: z.number().int().positive().optional(),
  note: z.string().max(280).optional(),
});

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = logPointSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { groupId, recipientId, presetId, customValue, note } = parsed.data;

  if (recipientId === req.userId) {
    return res.status(400).json({ error: "You can't log points about yourself" });
  }
  if (!(await isMember(groupId, req.userId!)) || !(await isMember(groupId, recipientId))) {
    return res.status(403).json({ error: "Both people must be in the group" });
  }

  const preset = await prisma.preset.findUnique({ where: { id: presetId } });
  if (!preset) return res.status(404).json({ error: "Preset not found" });

  let value: number;
  if (preset.isCustom) {
    const cap = preset.customCap ?? 5;
    if (!customValue || customValue < 1 || customValue > cap) {
      return res.status(400).json({ error: `Custom value must be between 1 and ${cap}` });
    }
    value = preset.polarity === "NEGATIVE" ? -customValue : customValue;
  } else {
    value = preset.defaultValue;
  }

  const entry = await prisma.pointEntry.create({
    data: {
      groupId,
      senderId: req.userId!,
      recipientId,
      presetId,
      value,
      note,
      status: "PENDING",
    },
    include: {
      sender: { select: { id: true, displayName: true, emoji: true } },
      recipient: { select: { id: true, displayName: true, emoji: true } },
      preset: true,
    },
  });

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  const sign = value > 0 ? "+" : "";
  sendPush(
    recipient?.pushToken,
    `${entry.sender.displayName} gave you ${sign}${value}`,
    `${preset.label}${note ? " — " + note : ""}. Accept or dispute?`,
    { type: "pending_point", pointEntryId: entry.id, groupId }
  );

  res.json(entry);
});

router.get("/pending", requireAuth, async (req: AuthedRequest, res) => {
  const entries = await prisma.pointEntry.findMany({
    where: { recipientId: req.userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, displayName: true, emoji: true } },
      group: { select: { id: true, name: true } },
      preset: true,
    },
  });
  res.json(entries);
});

router.post("/:id/accept", requireAuth, async (req: AuthedRequest, res) => {
  const entry = await prisma.pointEntry.findUnique({ where: { id: req.params.id }, include: { sender: true } });
  if (!entry) return res.status(404).json({ error: "Not found" });
  if (entry.recipientId !== req.userId) return res.status(403).json({ error: "Not your point entry" });
  if (entry.status !== "PENDING") return res.status(400).json({ error: "Already resolved" });

  const updated = await prisma.pointEntry.update({
    where: { id: entry.id },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });

  sendPush(entry.sender.pushToken, "Point accepted", `Your point entry was accepted.`, {
    type: "point_accepted",
    pointEntryId: entry.id,
  });

  res.json(updated);
});

router.post("/:id/dispute", requireAuth, async (req: AuthedRequest, res) => {
  const entry = await prisma.pointEntry.findUnique({ where: { id: req.params.id }, include: { sender: true } });
  if (!entry) return res.status(404).json({ error: "Not found" });
  if (entry.recipientId !== req.userId) return res.status(403).json({ error: "Not your point entry" });
  if (entry.status !== "PENDING") return res.status(400).json({ error: "Already resolved" });

  const updated = await prisma.pointEntry.update({
    where: { id: entry.id },
    data: { status: "DISPUTED", respondedAt: new Date() },
  });

  sendPush(entry.sender.pushToken, "Point disputed", `Your point entry was disputed.`, {
    type: "point_disputed",
    pointEntryId: entry.id,
  });

  res.json(updated);
});

export default router;
