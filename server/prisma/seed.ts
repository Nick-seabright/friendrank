import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const presets: {
  label: string;
  defaultValue: number;
  polarity: "POSITIVE" | "NEGATIVE";
  isCustom?: boolean;
  customCap?: number;
  autoAcceptHours?: number;
}[] = [
  { label: "Sent a funny meme", defaultValue: 2, polarity: "POSITIVE", autoAcceptHours: 24 },
  { label: "Came out when invited", defaultValue: 5, polarity: "POSITIVE", autoAcceptHours: 24 },
  { label: "Helped me move / big favor", defaultValue: 8, polarity: "POSITIVE", autoAcceptHours: 24 },
  { label: "Remembered something about my life", defaultValue: 3, polarity: "POSITIVE", autoAcceptHours: 24 },
  { label: "Defended me in an argument", defaultValue: 4, polarity: "POSITIVE", autoAcceptHours: 24 },
  { label: "Planned/organized a hang", defaultValue: 6, polarity: "POSITIVE", autoAcceptHours: 24 },
  {
    label: "Custom positive",
    defaultValue: 1,
    polarity: "POSITIVE",
    isCustom: true,
    customCap: 5,
    autoAcceptHours: 24,
  },
  { label: "Flaked last minute", defaultValue: -4, polarity: "NEGATIVE" },
  { label: "Trash talked my team/interest", defaultValue: -2, polarity: "NEGATIVE" },
  { label: "Left me on read for days", defaultValue: -2, polarity: "NEGATIVE" },
  { label: "Showed up late", defaultValue: -1, polarity: "NEGATIVE" },
  {
    label: "Custom negative",
    defaultValue: -1,
    polarity: "NEGATIVE",
    isCustom: true,
    customCap: 3,
  },
];

async function main() {
  for (const p of presets) {
    const existing = await prisma.preset.findFirst({ where: { label: p.label } });
    if (!existing) {
      await prisma.preset.create({ data: p });
    }
  }
  console.log(`Seeded ${presets.length} presets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
