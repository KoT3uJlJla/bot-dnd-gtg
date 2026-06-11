import { prisma } from "./prisma.js";
import { GAME_CLASSES } from "../game/classes/catalog.js";

async function main(): Promise<void> {
  for (const gameClass of GAME_CLASSES) {
    await prisma.gameClass.upsert({
      where: {
        key: gameClass.key
      },
      update: {
        name: gameClass.name,
        description: gameClass.description,
        role: gameClass.role,
        domain: gameClass.domain,
        hpMax: gameClass.hpMax,
        manaMax: gameClass.manaMax,
        staminaMax: gameClass.staminaMax,
        strength: gameClass.strength,
        agility: gameClass.agility,
        mind: gameClass.mind,
        will: gameClass.will,
        abilities: gameClass.abilities
      },
      create: {
        key: gameClass.key,
        name: gameClass.name,
        description: gameClass.description,
        role: gameClass.role,
        domain: gameClass.domain,
        hpMax: gameClass.hpMax,
        manaMax: gameClass.manaMax,
        staminaMax: gameClass.staminaMax,
        strength: gameClass.strength,
        agility: gameClass.agility,
        mind: gameClass.mind,
        will: gameClass.will,
        abilities: gameClass.abilities
      }
    });
  }

  console.log(`Seeded ${GAME_CLASSES.length} classes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
