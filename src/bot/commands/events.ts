import type { Bot } from "grammy";
import { prisma } from "../../db/prisma.js";
import { getActiveCharacter } from "../../game/characters/service.js";
import {
  eventStatusText,
  joinActiveEvent,
  leaveActiveEvent,
  performDeathSave,
  startIceWastelandEvent,
  stopActiveEvent
} from "../../game/events/eventService.js";
import { toTelegramId } from "../../utils/ids.js";
import { eventActionKeyboard, eventRegistrationKeyboard } from "../keyboards/event.js";
import { requireAdmin, requireGroupAccess } from "../middleware/access.js";
import type { AppContext } from "../types.js";

function groupTitle(ctx: AppContext): string | null {
  return ctx.chat && "title" in ctx.chat ? (ctx.chat.title ?? null) : null;
}

export function registerEventCommands(bot: Bot<AppContext>): void {
  bot.command("event_start", async (ctx) => {
    const adminId = await requireAdmin(ctx);
    if (!adminId) {
      return;
    }

    if (!ctx.chat || ctx.chat.type === "private") {
      await ctx.reply("Событие запускается в общем чате.");
      return;
    }

    const result = await startIceWastelandEvent(prisma, {
      telegramChatId: toTelegramId(ctx.chat.id),
      title: groupTitle(ctx),
      startedByTelegramId: adminId
    });

    await ctx.reply(result.message, {
      reply_markup: eventRegistrationKeyboard()
    });
  });

  bot.command("event_stop", async (ctx) => {
    const adminId = await requireAdmin(ctx);
    if (!adminId) {
      return;
    }

    if (!ctx.chat || ctx.chat.type === "private") {
      await ctx.reply("Эта команда работает в общем чате.");
      return;
    }

    const result = await stopActiveEvent(prisma, toTelegramId(ctx.chat.id));
    await ctx.reply(result.message);
  });

  bot.command("event_status", async (ctx) => {
    const user = await requireGroupAccess(ctx);
    if (!user || !ctx.chat) {
      return;
    }

    await ctx.reply(await eventStatusText(prisma, toTelegramId(ctx.chat.id)), {
      reply_markup: eventActionKeyboard()
    });
  });

  bot.command("event_join", async (ctx) => {
    const user = await requireGroupAccess(ctx);
    if (!user || !ctx.chat) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.reply("Сначала открой личку с ботом и создай персонажа.");
      return;
    }

    const result = await joinActiveEvent(prisma, {
      chatId: toTelegramId(ctx.chat.id),
      userId: user.id,
      character
    });

    await ctx.reply(result.message, {
      reply_markup: eventRegistrationKeyboard()
    });
  });

  bot.command("event_leave", async (ctx) => {
    const user = await requireGroupAccess(ctx);
    if (!user || !ctx.chat) {
      return;
    }

    const result = await leaveActiveEvent(prisma, {
      chatId: toTelegramId(ctx.chat.id),
      userId: user.id
    });

    await ctx.reply(result.message);
  });

  bot.command("death_save", async (ctx) => {
    const user = await requireGroupAccess(ctx);
    if (!user || !ctx.chat) {
      return;
    }

    const character = await getActiveCharacter(prisma, user.id);
    if (!character) {
      await ctx.reply("Сначала открой личку с ботом и создай персонажа.");
      return;
    }

    const result = await performDeathSave(bot, prisma, {
      chatId: toTelegramId(ctx.chat.id),
      userId: user.id,
      character
    });

    await ctx.reply(result.message, {
      reply_markup: eventActionKeyboard()
    });
  });
}
