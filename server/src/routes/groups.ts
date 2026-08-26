import { Router } from "express";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "../db";
import { requireAuth, AuthedRequest } from "../auth";

const router = Router();
const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const SOFT_CAP = 8;

async function assertMember(groupId: string, userId: string) {
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return !!membership;
}

const createGroupSchema = z.object({
  name: z.string().min(1).max(40),
  leaderboardPeriod: z.enum(["WEEKLY", "MONTHLY", "MANUAL"]).optional(),
});

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let inviteCode = genCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.group.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = genCode();
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      leaderboardPeriod: parsed.data.leaderboardPeriod || "MANUAL",
      inviteCode,
      createdById: req.userId!,
      memberships: { create: { userId: req.userId! } },
    },
  });

  res.json(group);
});

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId: req.userId },
    include: { group: { include: { _count: { select: { memberships: true } } } } },
  });
  res.json(
    memberships.map((m) => ({
      ...m.group,
      memberCount: m.group._count.memberships,
    }))
  );
});

const joinSchema = z.object({ inviteCode: z.string().min(4).max(10) });

router.post("/join", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const group = await prisma.group.findUnique({
    where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
    include: { _count: { select: { memberships: true } } },
  });
  if (!group) return res.status(404).json({ error: "Invalid invite code" });

  const already = await assertMember(group.id, req.userId!);
  if (already) return res.json({ group, warning: null, alreadyMember: true });

  await prisma.groupMembership.create({ data: { userId: req.userId!, groupId: group.id } });

  const warning =
    group._count.memberships + 1 > SOFT_CAP
      ? `Heads up: this group now has ${group._count.memberships + 1} people. Past ${SOFT_CAP}, the feed gets noisy and scores mean less.`
      : null;

  res.json({ group, warning, alreadyMember: false });
});

router.get("/:groupId", requireAuth, async (req: AuthedRequest, res) => {
  const { groupId } = req.params;
  if (!(await assertMember(groupId, req.userId!))) return res.status(403).json({ error: "Not a member" });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: { include: { user: { select: { id: true, displayName: true, emoji: true } } } },
    },
  });
  if (!group) return res.status(404).json({ error: "Group not found" });
  res.json(group);
});

router.get("/:groupId/leaderboard", requireAuth, async (req: AuthedRequest, res) => {
  const { groupId } = req.params;
  if (!(await assertMember(groupId, req.userId!))) return res.status(403).json({ error: "Not a member" });

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ error: "Group not found" });

  const members = await prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: { select: { id: true, displayName: true, emoji: true } } },
  });

  const [periodPoints, allTimePoints] = await Promise.all([
    prisma.pointEntry.findMany({
      where: { groupId, status: "ACCEPTED", createdAt: { gte: group.periodStartAt } },
    }),
    prisma.pointEntry.findMany({ where: { groupId, status: "ACCEPTED" } }),
  ]);

  const contestedCounts = await prisma.pointEntry.groupBy({
    by: ["recipientId"],
    where: { groupId, status: "DISPUTED" },
    _count: { _all: true },
  });
  const contestedMap = new Map(contestedCounts.map((c) => [c.recipientId, c._count._all]));

  const board = members.map((m) => {
    const periodTotal = periodPoints
      .filter((p) => p.recipientId === m.userId)
      .reduce((sum, p) => sum + p.value, 0);
    const allTimeTotal = allTimePoints
      .filter((p) => p.recipientId === m.userId)
      .reduce((sum, p) => sum + p.value, 0);
    return {
      user: m.user,
      periodScore: periodTotal,
      allTimeScore: allTimeTotal,
      contestedCount: contestedMap.get(m.userId) || 0,
    };
  });

  board.sort((a, b) => b.periodScore - a.periodScore);

  res.json({
    leaderboardPeriod: group.leaderboardPeriod,
    periodStartAt: group.periodStartAt,
    board,
  });
});

router.post("/:groupId/reset", requireAuth, async (req: AuthedRequest, res) => {
  const { groupId } = req.params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return res.status(404).json({ error: "Group not found" });
  if (group.createdById !== req.userId) {
    return res.status(403).json({ error: "Only the group creator can reset the leaderboard" });
  }
  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { periodStartAt: new Date() },
  });
  res.json(updated);
});

router.get("/:groupId/feed", requireAuth, async (req: AuthedRequest, res) => {
  const { groupId } = req.params;
  if (!(await assertMember(groupId, req.userId!))) return res.status(403).json({ error: "Not a member" });

  const entries = await prisma.pointEntry.findMany({
    where: { groupId, status: { in: ["ACCEPTED", "DISPUTED"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sender: { select: { id: true, displayName: true, emoji: true } },
      recipient: { select: { id: true, displayName: true, emoji: true } },
      preset: true,
    },
  });
  res.json(entries);
});

export default router;
