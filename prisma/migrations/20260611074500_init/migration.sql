-- CreateEnum
CREATE TYPE "CharacterStatus" AS ENUM ('ALIVE', 'WOUNDED', 'DYING', 'DEAD');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('CREATED', 'REGISTRATION', 'ACT_1', 'ACT_2', 'ACT_3', 'COMBAT', 'SCENE_RESOLUTION', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantMode" AS ENUM ('UNASSIGNED', 'SOLO', 'SQUAD');

-- CreateEnum
CREATE TYPE "SquadStatus" AS ENUM ('OPEN', 'FULL', 'LOCKED');

-- CreateEnum
CREATE TYPE "DiceRollType" AS ENUM ('NORMAL', 'ADVANTAGE', 'DISADVANTAGE', 'DEATH_SAVE');

-- CreateEnum
CREATE TYPE "CombatStatus" AS ENUM ('ACTIVE', 'WON', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CombatSide" AS ENUM ('PLAYER', 'ENEMY');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "hasStartedBot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowed_users" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "addedByTelegramId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowed_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "classKey" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "hpCurrent" INTEGER NOT NULL,
    "hpMax" INTEGER NOT NULL,
    "manaCurrent" INTEGER NOT NULL,
    "manaMax" INTEGER NOT NULL,
    "staminaCurrent" INTEGER NOT NULL,
    "staminaMax" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "agility" INTEGER NOT NULL,
    "mind" INTEGER NOT NULL,
    "will" INTEGER NOT NULL,
    "status" "CharacterStatus" NOT NULL DEFAULT 'ALIVE',
    "freeClassChangeAvailable" BOOLEAN NOT NULL DEFAULT true,
    "deathSaveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "deathSaveFailures" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "eventPoints" INTEGER NOT NULL DEFAULT 0,
    "iceShards" INTEGER NOT NULL DEFAULT 0,
    "activePetId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "hpMax" INTEGER NOT NULL,
    "manaMax" INTEGER NOT NULL,
    "staminaMax" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "agility" INTEGER NOT NULL,
    "mind" INTEGER NOT NULL,
    "will" INTEGER NOT NULL,
    "abilities" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER,
    "speciesKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "biome" TEXT NOT NULL,
    "bonusType" TEXT NOT NULL,
    "bonusValue" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER,
    "itemKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipped_items" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "inventoryItemId" INTEGER,
    "slot" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipped_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_chats" (
    "id" SERIAL NOT NULL,
    "telegramChatId" BIGINT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "groupChatId" INTEGER NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'REGISTRATION',
    "act" INTEGER NOT NULL DEFAULT 1,
    "sceneIndex" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentEnemyKey" TEXT,
    "startedByTelegramId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "mode" "ParticipantMode" NOT NULL DEFAULT 'UNASSIGNED',
    "squadId" INTEGER,
    "contribution" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "squads" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SquadStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "squads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "squad_members" (
    "id" SERIAL NOT NULL,
    "squadId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squad_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dice_rolls" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER,
    "userId" INTEGER,
    "characterId" INTEGER,
    "chatId" BIGINT NOT NULL,
    "messageId" INTEGER,
    "context" TEXT NOT NULL,
    "rollType" "DiceRollType" NOT NULL DEFAULT 'NORMAL',
    "value" INTEGER NOT NULL,
    "effectiveValue" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dice_rolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_sessions" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "status" "CombatStatus" NOT NULL DEFAULT 'ACTIVE',
    "enemyKey" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_entities" (
    "id" SERIAL NOT NULL,
    "combatSessionId" INTEGER NOT NULL,
    "characterId" INTEGER,
    "enemyKey" TEXT,
    "name" TEXT NOT NULL,
    "side" "CombatSide" NOT NULL,
    "hpCurrent" INTEGER NOT NULL,
    "hpMax" INTEGER NOT NULL,
    "manaCurrent" INTEGER NOT NULL DEFAULT 0,
    "staminaCurrent" INTEGER NOT NULL DEFAULT 0,
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "eventPoints" INTEGER NOT NULL DEFAULT 0,
    "iceShards" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "items" JSONB,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" SERIAL NOT NULL,
    "adminTelegramId" BIGINT NOT NULL,
    "action" TEXT NOT NULL,
    "targetTelegramId" BIGINT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE INDEX "users_telegramId_idx" ON "users"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "allowed_users_telegramId_key" ON "allowed_users"("telegramId");

-- CreateIndex
CREATE INDEX "allowed_users_telegramId_isBanned_idx" ON "allowed_users"("telegramId", "isBanned");

-- CreateIndex
CREATE INDEX "characters_userId_status_idx" ON "characters"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "classes_key_key" ON "classes"("key");

-- CreateIndex
CREATE INDEX "pets_userId_isActive_idx" ON "pets"("userId", "isActive");

-- CreateIndex
CREATE INDEX "inventory_items_userId_itemKey_idx" ON "inventory_items"("userId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_characterId_itemKey_key" ON "inventory_items"("characterId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "equipped_items_characterId_slot_key" ON "equipped_items"("characterId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "group_chats_telegramChatId_key" ON "group_chats"("telegramChatId");

-- CreateIndex
CREATE INDEX "events_groupChatId_status_idx" ON "events"("groupChatId", "status");

-- CreateIndex
CREATE INDEX "event_participants_userId_eventId_idx" ON "event_participants"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_eventId_userId_key" ON "event_participants"("eventId", "userId");

-- CreateIndex
CREATE INDEX "squads_eventId_status_idx" ON "squads"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "squad_members_participantId_key" ON "squad_members"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "squad_members_squadId_participantId_key" ON "squad_members"("squadId", "participantId");

-- CreateIndex
CREATE INDEX "dice_rolls_eventId_characterId_idx" ON "dice_rolls"("eventId", "characterId");

-- CreateIndex
CREATE INDEX "combat_sessions_eventId_status_idx" ON "combat_sessions"("eventId", "status");

-- CreateIndex
CREATE INDEX "combat_entities_combatSessionId_side_idx" ON "combat_entities"("combatSessionId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "rewards_eventId_userId_key" ON "rewards"("eventId", "userId");

-- CreateIndex
CREATE INDEX "admin_logs_adminTelegramId_action_idx" ON "admin_logs"("adminTelegramId", "action");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipped_items" ADD CONSTRAINT "equipped_items_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipped_items" ADD CONSTRAINT "equipped_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_groupChatId_fkey" FOREIGN KEY ("groupChatId") REFERENCES "group_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squads" ADD CONSTRAINT "squads_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_squadId_fkey" FOREIGN KEY ("squadId") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "event_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_rolls" ADD CONSTRAINT "dice_rolls_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dice_rolls" ADD CONSTRAINT "dice_rolls_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_sessions" ADD CONSTRAINT "combat_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_entities" ADD CONSTRAINT "combat_entities_combatSessionId_fkey" FOREIGN KEY ("combatSessionId") REFERENCES "combat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_entities" ADD CONSTRAINT "combat_entities_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
