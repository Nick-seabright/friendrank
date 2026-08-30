-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🦆',
    "pushToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "leaderboardPeriod" TEXT NOT NULL DEFAULT 'MANUAL',
    "periodStartAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preset" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "defaultValue" INTEGER NOT NULL,
    "polarity" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customCap" INTEGER,
    "autoAcceptHours" INTEGER,

    CONSTRAINT "Preset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointEntry" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "PointEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_userId_groupId_key" ON "GroupMembership"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointEntry" ADD CONSTRAINT "PointEntry_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Preset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
