import type { Bot } from "grammy";
import { prisma } from "../../db/prisma.js";
import {
  changeCharacterClass,
  characterProfileText,
  classesHelpText,
  createCharacter,
  getActiveCharacter
} from "../../game/characters/service.js";
import { getItemConfig } from "../../game/items/catalog.js";
import { formatTelegramUserName } from "../../utils/text.js";
import { classKeyboard, privateHomeKeyboard } from "../keyboards/private.js";
import {
  markPrivateStarted,
  requirePrivateAccess,
  upsertUserFromContext
} from "../middleware/access.js";
import type { AppContext } from "../types.js";

const pendingCharacterNames = new Map<number, string>();

function commandArg(match: unknown): string {
  return typeof match === "string" ? match.trim() : "";
}

export function registerPrivateCommands(bot: Bot<AppContext>): void {
  bot.command("start", async (ctx) => {
    const user = await upsertUserFromContext(ctx);
    if (!user) {
      return;
    }

    if (ctx.chat?.type !== "private") {
      await ctx.reply("Напиши /start в личке с ботом.");
      return;
    }

    const accessUser = await requirePrivateAccess(ctx);
    if (!accessUser) {
      return;
    }

    await markPrivateStarted(accessUser.id);
    await ctx.reply(
      [
        "Добро пожаловать в Gatto RPG.",
        "Личка нужна для персонажа, класса, питомцев, инвентаря и расходников.",
        "Создай аватара: /create <имя>"
      ].join("\n"),
      {
        reply_markup: privateHomeKeyboard()
      }
    );
  });

  bot.command("help", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    await ctx.reply(
      [
        "Личка:",
        "/create <имя> — создать аватара и выбрать класс",
        "/profile — профиль",
        "/class — классы и смена класса",
        "/inventory — инвентарь",
        "/equipment — экипировка",
        "/pet — питомцы",
        "/use <item_key> — использовать расходник",
        "",
        "Общий чат:",
        "/event_join, /event_status, /event_leave, /death_save"
      ].join("\n")
    );
  });

  bot.command("create", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user || !ctx.from) {
      return;
    }

    const existing = await getActiveCharacter(prisma, user.id);
    if (existing && existing.status !== "DEAD") {
      await ctx.reply("У тебя уже есть активный аватар. Посмотри /profile или смени класс через /class.");
      return;
    }

    const name = commandArg(ctx.match) || formatTelegramUserName(user);
    pendingCharacterNames.set(ctx.from.id, name.slice(0, 48));

    await ctx.reply(`Имя аватара: ${name}. Теперь выбери класс.`, {
      reply_markup: classKeyboard("create_class")
    });
  });

  bot.command("profile", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.reply("Сначала создай персонажа: /create <имя>");
      return;
    }

    await ctx.reply(characterProfileText(character), {
      reply_markup: privateHomeKeyboard()
    });
  });

  bot.command("class", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    await ctx.reply(["Доступные классы:", classesHelpText()].join("\n"), {
      reply_markup: classKeyboard("change_class")
    });
  });

  bot.command("inventory", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.reply("Сначала создай персонажа: /create <имя>");
      return;
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        characterId: character.id,
        quantity: {
          gt: 0
        }
      },
      orderBy: [{ slot: "asc" }, { name: "asc" }]
    });

    if (items.length === 0) {
      await ctx.reply("Инвентарь пуст.");
      return;
    }

    await ctx.reply(
      items
        .map((item) => {
          const config = getItemConfig(item.itemKey);
          return `• ${item.name} x${item.quantity} [${item.itemKey}] — ${config.description}`;
        })
        .join("\n")
    );
  });

  bot.command("equipment", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.reply("Сначала создай персонажа: /create <имя>");
      return;
    }

    const equipment = await prisma.equippedItem.findMany({
      where: {
        characterId: character.id
      },
      orderBy: {
        slot: "asc"
      }
    });

    await ctx.reply(
      equipment.length > 0
        ? equipment.map((item) => `• ${item.slot}: ${getItemConfig(item.itemKey).name}`).join("\n")
        : "Экипировка пуста."
    );
  });

  bot.command("pet", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.reply("Сначала создай персонажа: /create <имя>");
      return;
    }

    const pets = await prisma.pet.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (pets.length === 0) {
      await ctx.reply("Питомцев пока нет.");
      return;
    }

    await ctx.reply(
      pets
        .map((pet) => `• ${pet.name} — ${pet.biome}, бонус ${pet.bonusType} +${pet.bonusValue}`)
        .join("\n")
    );
  });

  bot.command("use", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.reply("Сначала создай персонажа: /create <имя>");
      return;
    }

    const itemKey = commandArg(ctx.match);
    if (!itemKey) {
      await ctx.reply("Использование: /use <item_key>");
      return;
    }

    const item = await prisma.inventoryItem.findFirst({
      where: {
        characterId: character.id,
        itemKey,
        quantity: {
          gt: 0
        }
      }
    });

    if (!item) {
      await ctx.reply("Такого расходника нет в инвентаре.");
      return;
    }

    const config = getItemConfig(item.itemKey);
    if (config.slot !== "consumable") {
      await ctx.reply("Этот предмет нельзя использовать как расходник.");
      return;
    }

    const update =
      config.consumableEffect === "heal_hp"
        ? { hpCurrent: Math.min(character.hpMax, character.hpCurrent + 4) }
        : config.consumableEffect === "restore_mana"
          ? { manaCurrent: Math.min(character.manaMax, character.manaCurrent + 4) }
          : config.consumableEffect === "restore_stamina"
            ? { staminaCurrent: Math.min(character.staminaMax, character.staminaCurrent + 4) }
            : {};

    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: {
            decrement: 1
          }
        }
      }),
      prisma.character.update({
        where: { id: character.id },
        data: update
      })
    ]);

    await ctx.reply(`${config.name} использован.`);
  });

  bot.callbackQuery(/^create_class:(.+)$/, async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user || !ctx.from) {
      return;
    }

    const existing = await getActiveCharacter(prisma, user.id);
    if (existing && existing.status !== "DEAD") {
      await ctx.answerCallbackQuery({
        text: "У тебя уже есть активный аватар.",
        show_alert: true
      });
      return;
    }

    const classKey = ctx.match[1];
    if (!classKey) {
      await ctx.answerCallbackQuery({
        text: "Класс не найден.",
        show_alert: true
      });
      return;
    }

    const fallbackName = formatTelegramUserName(user);
    const name = pendingCharacterNames.get(ctx.from.id) ?? fallbackName;
    const character = await createCharacter(prisma, {
      userId: user.id,
      name,
      classKey
    });
    pendingCharacterNames.delete(ctx.from.id);

    await ctx.answerCallbackQuery("Аватар создан.");
    await ctx.reply(characterProfileText(character), {
      reply_markup: privateHomeKeyboard()
    });
  });

  bot.callbackQuery(/^change_class:(.+)$/, async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.answerCallbackQuery({
        text: "Сначала создай персонажа.",
        show_alert: true
      });
      return;
    }

    const classKey = ctx.match[1];
    if (!classKey) {
      await ctx.answerCallbackQuery({
        text: "Класс не найден.",
        show_alert: true
      });
      return;
    }

    const result = await changeCharacterClass(prisma, character.id, classKey);
    if (!result.ok) {
      await ctx.answerCallbackQuery({
        text: result.reason,
        show_alert: true
      });
      return;
    }

    await ctx.answerCallbackQuery(
      result.usedRebirthScroll ? "Класс изменен через Свиток Перерождения." : "Класс изменен."
    );
    await ctx.reply(characterProfileText(result.character));
  });

  bot.callbackQuery("private:profile", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    await ctx.answerCallbackQuery();
    await ctx.reply(character ? characterProfileText(character) : "Сначала создай персонажа: /create <имя>");
  });

  bot.callbackQuery("private:classes", async (ctx) => {
    const user = await requirePrivateAccess(ctx);
    if (!user) {
      return;
    }

    await ctx.answerCallbackQuery();
    await ctx.reply(["Доступные классы:", classesHelpText()].join("\n"), {
      reply_markup: classKeyboard("change_class")
    });
  });

  bot.callbackQuery("private:inventory", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Открой инвентарь командой /inventory.");
  });

  bot.callbackQuery("private:pet", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Открой питомцев командой /pet.");
  });
}
