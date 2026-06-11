import type { Character, PrismaClient } from "@prisma/client";
import { GAME_CLASSES, getClassConfig } from "../classes/catalog.js";
import { getItemConfig, STARTER_ITEM_KEYS } from "../items/catalog.js";
import { getPetConfig, STARTER_PET_KEY } from "../pets/catalog.js";

export type CharacterChangeResult =
  | { ok: true; character: Character; usedRebirthScroll: boolean }
  | { ok: false; reason: string };

export async function createCharacter(
  prisma: PrismaClient,
  input: {
    userId: number;
    name: string;
    classKey: string;
  }
): Promise<Character> {
  const classConfig = getClassConfig(input.classKey);
  const safeName = input.name.trim().slice(0, 48) || "Безымянный аватар";

  const character = await prisma.character.create({
    data: {
      userId: input.userId,
      name: safeName,
      classKey: classConfig.key,
      hpCurrent: classConfig.hpMax,
      hpMax: classConfig.hpMax,
      manaCurrent: classConfig.manaMax,
      manaMax: classConfig.manaMax,
      staminaCurrent: classConfig.staminaMax,
      staminaMax: classConfig.staminaMax,
      strength: classConfig.strength,
      agility: classConfig.agility,
      mind: classConfig.mind,
      will: classConfig.will
    }
  });

  await grantStarterLoadout(prisma, input.userId, character.id);
  return prisma.character.findUniqueOrThrow({ where: { id: character.id } });
}

export async function getActiveCharacter(
  prisma: PrismaClient,
  userId: number
): Promise<Character | null> {
  const alive = await prisma.character.findFirst({
    where: {
      userId,
      status: {
        not: "DEAD"
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (alive) {
    return alive;
  }

  return prisma.character.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" }
  });
}

export async function changeCharacterClass(
  prisma: PrismaClient,
  characterId: number,
  nextClassKey: string
): Promise<CharacterChangeResult> {
  const nextClass = getClassConfig(nextClassKey);
  const character = await prisma.character.findUnique({
    where: { id: characterId }
  });

  if (!character) {
    return { ok: false, reason: "Персонаж не найден." };
  }

  if (character.status === "DEAD") {
    return {
      ok: false,
      reason: "Твой аватар погиб и не может менять класс. Создай нового аватара."
    };
  }

  const rebirthScroll = await prisma.inventoryItem.findFirst({
    where: {
      characterId,
      itemKey: "rebirth_scroll",
      quantity: {
        gt: 0
      }
    }
  });

  if (!character.freeClassChangeAvailable && !rebirthScroll) {
    return {
      ok: false,
      reason:
        "Бесплатная смена класса уже использована. Нужен Свиток Перерождения."
    };
  }

  return prisma.$transaction(async (tx) => {
    if (!character.freeClassChangeAvailable && rebirthScroll) {
      await tx.inventoryItem.update({
        where: { id: rebirthScroll.id },
        data: {
          quantity: {
            decrement: 1
          }
        }
      });
    }

    const updated = await tx.character.update({
      where: { id: characterId },
      data: {
        classKey: nextClass.key,
        hpMax: nextClass.hpMax,
        hpCurrent: nextClass.hpMax,
        manaMax: nextClass.manaMax,
        manaCurrent: nextClass.manaMax,
        staminaMax: nextClass.staminaMax,
        staminaCurrent: nextClass.staminaMax,
        strength: nextClass.strength,
        agility: nextClass.agility,
        mind: nextClass.mind,
        will: nextClass.will,
        freeClassChangeAvailable: false
      }
    });

    return {
      ok: true,
      character: updated,
      usedRebirthScroll: !character.freeClassChangeAvailable
    };
  });
}

export async function grantStarterLoadout(
  prisma: PrismaClient,
  userId: number,
  characterId: number
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const starterPet = getPetConfig(STARTER_PET_KEY);
    const existingPet = await tx.pet.findFirst({
      where: {
        userId,
        characterId,
        speciesKey: starterPet.key
      }
    });

    const pet =
      existingPet ??
      (await tx.pet.create({
        data: {
          userId,
          characterId,
          speciesKey: starterPet.key,
          name: starterPet.name,
          biome: starterPet.biome,
          bonusType: starterPet.bonusType,
          bonusValue: starterPet.bonusValue,
          isActive: true
        }
      }));

    await tx.character.update({
      where: { id: characterId },
      data: {
        activePetId: pet.id
      }
    });

    for (const itemKey of STARTER_ITEM_KEYS) {
      const item = getItemConfig(itemKey);
      const quantity = item.slot === "consumable" ? 2 : 1;
      const inventory = await tx.inventoryItem.upsert({
        where: {
          characterId_itemKey: {
            characterId,
            itemKey
          }
        },
        update: {
          quantity: {
            increment: quantity
          }
        },
        create: {
          userId,
          characterId,
          itemKey,
          name: item.name,
          slot: item.slot,
          quantity
        }
      });

      if (item.slot === "weapon" || item.slot === "armor") {
        await tx.equippedItem.upsert({
          where: {
            characterId_slot: {
              characterId,
              slot: item.slot
            }
          },
          update: {
            inventoryItemId: inventory.id,
            itemKey
          },
          create: {
            characterId,
            inventoryItemId: inventory.id,
            slot: item.slot,
            itemKey
          }
        });
      }
    }
  });
}

export async function consumeInventoryItem(
  prisma: PrismaClient,
  characterId: number,
  itemKey: string
): Promise<boolean> {
  const item = await prisma.inventoryItem.findFirst({
    where: {
      characterId,
      itemKey,
      quantity: {
        gt: 0
      }
    }
  });

  if (!item) {
    return false;
  }

  await prisma.inventoryItem.update({
    where: { id: item.id },
    data: {
      quantity: {
        decrement: 1
      }
    }
  });

  return true;
}

export function characterProfileText(character: Character): string {
  const classConfig = getClassConfig(character.classKey);
  const freeChange = character.freeClassChangeAvailable ? "доступна" : "использована";

  return [
    `🧭 ${character.name}`,
    `Класс: ${classConfig.name}`,
    `Статус: ${character.status}`,
    `Уровень: ${character.level} | XP: ${character.xp}`,
    `HP: ${character.hpCurrent}/${character.hpMax}`,
    `Mana: ${character.manaCurrent}/${character.manaMax}`,
    `Stamina: ${character.staminaCurrent}/${character.staminaMax}`,
    `Сила ${character.strength} | Ловкость ${character.agility} | Разум ${character.mind} | Воля ${character.will}`,
    `Монеты: ${character.coins} | Очки события: ${character.eventPoints} | Ледяные осколки: ${character.iceShards}`,
    `Бесплатная смена класса: ${freeChange}`
  ].join("\n");
}

export function classesHelpText(): string {
  return GAME_CLASSES.map(
    (item) =>
      `${item.name} — ${item.role}. Домен: ${item.domain}. HP/Mana/Stamina: ${item.hpMax}/${item.manaMax}/${item.staminaMax}.`
  ).join("\n");
}
