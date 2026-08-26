import { prisma } from "../db";

const NEGATIVE_EXPIRY_DAYS = 7;

export async function runAutoAcceptSweep() {
  const now = Date.now();

  const pending = await prisma.pointEntry.findMany({
    where: { status: "PENDING" },
    include: { preset: true },
  });

  for (const entry of pending) {
    const ageMs = now - entry.createdAt.getTime();

    if (entry.preset.polarity === "POSITIVE" && entry.preset.autoAcceptHours) {
      const thresholdMs = entry.preset.autoAcceptHours * 60 * 60 * 1000;
      if (ageMs >= thresholdMs) {
        await prisma.pointEntry.update({
          where: { id: entry.id },
          data: { status: "ACCEPTED", respondedAt: new Date() },
        });
      }
    } else if (entry.preset.polarity === "NEGATIVE") {
      const thresholdMs = NEGATIVE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      if (ageMs >= thresholdMs) {
        await prisma.pointEntry.update({
          where: { id: entry.id },
          data: { status: "EXPIRED", respondedAt: new Date() },
        });
      }
    }
  }
}

export function startAutoAcceptJob() {
  runAutoAcceptSweep().catch((err) => console.error("Auto-accept sweep failed:", err));
  setInterval(() => {
    runAutoAcceptSweep().catch((err) => console.error("Auto-accept sweep failed:", err));
  }, 15 * 60 * 1000);
}
