import type { Bot } from "grammy";
import { prisma } from "../../db/prisma.js";
import { getActiveCharacter } from "../../game/characters/service.js";
import { getItemConfig } from "../../game/items/catalog.js";
import {
  eventStatusText,
  joinActiveEvent,
  joinOpenSquad,
  performDeathSave,
  performSceneAction,
  setSoloMode
} from "../../game/events/eventService.js";
import { toTelegramId } from "../../utils/ids.js";
import { eventActionKeyboard, eventRegistrationKeyboard } from "../keyboards/event.js";
import { requireCallbackGroupAccess } from "../middleware/access.js";
import type { AppContext } from "../types.js";

function callbackChatId(ctx: AppContext): bigint | null {
  const chatId = ctx.callbackQuery?.message?.chat.id;
  return typeof chatId === "number" ? toTelegramId(chatId) : null;
}

export function registerCallbacks(bot: Bot<AppContext>): void {
  bot.callbackQuery("event:join", async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    const chatId = callbackChatId(ctx);
    if (!user || !chatId) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.answerCallbackQuery({
        text: "Сначала открой личку с ботом и создай персонажа.",
        show_alert: true
      });
      return;
    }

    const result = await joinActiveEvent(prisma, {
      chatId,
      userId: user.id,
      character
    });

    await ctx.answerCallbackQuery({
      text: result.message,
      show_alert: !result.ok
    });
    if (result.ok) {
      await ctx.reply(result.message, {
        reply_markup: eventRegistrationKeyboard()
      });
    }
  });

  bot.callbackQuery("event:solo", async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    const chatId = callbackChatId(ctx);
    if (!user || !chatId) {
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

    await joinActiveEvent(prisma, {
      chatId,
      userId: user.id,
      character
    });
    const result = await setSoloMode(prisma, {
      chatId,
      userId: user.id
    });

    await ctx.answerCallbackQuery({
      text: result.message,
      show_alert: !result.ok
    });
    await ctx.reply(result.message, {
      reply_markup: eventActionKeyboard()
    });
  });

  bot.callbackQuery(["event:find_squad", "event:create_squad"], async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    const chatId = callbackChatId(ctx);
    if (!user || !chatId) {
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

    await joinActiveEvent(prisma, {
      chatId,
      userId: user.id,
      character
    });
    const result = await joinOpenSquad(prisma, {
      chatId,
      userId: user.id,
      forceNew: ctx.callbackQuery.data === "event:create_squad"
    });

    await ctx.answerCallbackQuery({
      text: result.message,
      show_alert: !result.ok
    });
    await ctx.reply(result.message, {
      reply_markup: eventActionKeyboard()
    });
  });

  bot.callbackQuery(["event:action", "event:attack"], async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    const chatId = callbackChatId(ctx);
    if (!user || !chatId) {
      return;
    }

    const result = await performSceneAction(bot, prisma, {
      chatId,
      userId: user.id
    });

    await ctx.answerCallbackQuery({
      text: result.ok ? "Действие выполнено." : result.message,
      show_alert: !result.ok
    });
    await ctx.reply(result.message, {
      reply_markup: eventActionKeyboard()
    });
  });

  bot.callbackQuery("event:status", async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    const chatId = callbackChatId(ctx);
    if (!user || !chatId) {
      return;
    }

    await ctx.answerCallbackQuery();
    await ctx.reply(await eventStatusText(prisma, chatId), {
      reply_markup: eventActionKeyboard()
    });
  });

  bot.callbackQuery("event:death_save", async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    const chatId = callbackChatId(ctx);
    if (!user || !chatId) {
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

    const result = await performDeathSave(bot, prisma, {
      chatId,
      userId: user.id,
      character
    });

    await ctx.answerCallbackQuery({
      text: result.message,
      show_alert: !result.ok
    });
    await ctx.reply(result.message, {
      reply_markup: eventActionKeyboard()
    });
  });

  bot.callbackQuery("event:consumable", async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    const chatId = callbackChatId(ctx);
    if (!user || !chatId) {
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

    const item = await prisma.inventoryItem.findFirst({
      where: {
        characterId: character.id,
        itemKey: "small_healing_potion",
        quantity: {
          gt: 0
        }
      }
    });

    if (!item) {
      await ctx.answerCallbackQuery({
        text: "Малого зелья лечения нет.",
        show_alert: true
      });
      return;
    }

    const config = getItemConfig(item.itemKey);
    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: {
          id: item.id
        },
        data: {
          quantity: {
            decrement: 1
          }
        }
      }),
      prisma.character.update({
        where: {
          id: character.id
        },
        data: {
          hpCurrent: Math.min(character.hpMax, character.hpCurrent + 4),
          status: character.status === "DYING" ? "WOUNDED" : character.status
        }
      })
    ]);

    await ctx.answerCallbackQuery(`${config.name} использован.`);
    await ctx.reply(`${character.name} использует ${config.name}: +4 HP.`, {
      reply_markup: eventActionKeyboard()
    });
  });

  bot.callbackQuery("event:pet", async (ctx) => {
    const user = await requireCallbackGroupAccess(ctx);
    if (!user) {
      return;
    }

    await ctx.answerCallbackQuery("Активный питомец помогает автоматически, если его бонус подходит сцене.");
  });
}
