import { isAdminTelegramId } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { toTelegramId } from "../../utils/ids.js";
export async function upsertUserFromContext(ctx) {
    if (!ctx.from) {
        return null;
    }
    const telegramId = toTelegramId(ctx.from.id);
    return prisma.user.upsert({
        where: {
            telegramId
        },
        update: {
            username: ctx.from.username ?? null,
            firstName: ctx.from.first_name ?? null,
            lastName: ctx.from.last_name ?? null
        },
        create: {
            telegramId,
            username: ctx.from.username ?? null,
            firstName: ctx.from.first_name ?? null,
            lastName: ctx.from.last_name ?? null
        }
    });
}
export async function isAllowedToPlay(telegramId) {
    if (isAdminTelegramId(telegramId)) {
        return true;
    }
    const allowed = await prisma.allowedUser.findUnique({
        where: {
            telegramId
        }
    });
    return Boolean(allowed && !allowed.isBanned);
}
export async function requireAdmin(ctx) {
    if (!ctx.from) {
        return null;
    }
    const telegramId = toTelegramId(ctx.from.id);
    if (!isAdminTelegramId(telegramId)) {
        await ctx.reply("Эта команда доступна только администратору.");
        return null;
    }
    return telegramId;
}
export async function requirePrivateAccess(ctx) {
    const user = await upsertUserFromContext(ctx);
    if (!user) {
        return null;
    }
    if (ctx.chat?.type !== "private") {
        await ctx.reply("Эта команда работает в личке с ботом.");
        return null;
    }
    const allowed = await isAllowedToPlay(user.telegramId);
    if (!allowed) {
        await ctx.reply("У тебя нет доступа к этому событию.");
        return null;
    }
    return user;
}
export async function markPrivateStarted(userId) {
    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            hasStartedBot: true
        }
    });
}
export async function requireGroupAccess(ctx) {
    const user = await upsertUserFromContext(ctx);
    if (!user) {
        return null;
    }
    if (ctx.chat?.type === "private") {
        await ctx.reply("Эта команда работает в общем чате, куда добавлен бот.");
        return null;
    }
    const allowed = await isAllowedToPlay(user.telegramId);
    if (!allowed) {
        await ctx.reply("У тебя нет доступа к этому событию.");
        return null;
    }
    if (!user.hasStartedBot) {
        await ctx.reply("Сначала открой личку с ботом и введи /start.");
        return null;
    }
    return user;
}
export async function requireCallbackGroupAccess(ctx) {
    const user = await upsertUserFromContext(ctx);
    if (!user) {
        return null;
    }
    const allowed = await isAllowedToPlay(user.telegramId);
    if (!allowed) {
        await ctx.answerCallbackQuery({
            text: "У тебя нет доступа к этому событию.",
            show_alert: true
        });
        return null;
    }
    if (!user.hasStartedBot) {
        await ctx.answerCallbackQuery({
            text: "Сначала открой личку с ботом и введи /start.",
            show_alert: true
        });
        return null;
    }
    return user;
}
