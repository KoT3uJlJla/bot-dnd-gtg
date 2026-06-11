import { prisma } from "../../db/prisma.js";
import { requireAdmin } from "../middleware/access.js";
function parseTelegramId(raw) {
    try {
        const value = raw.trim();
        return value ? BigInt(value) : null;
    }
    catch {
        return null;
    }
}
function commandArg(match) {
    return typeof match === "string" ? match.trim() : "";
}
export function registerAdminCommands(bot) {
    bot.command("admin_add", async (ctx) => {
        const adminId = await requireAdmin(ctx);
        if (!adminId) {
            return;
        }
        const targetId = parseTelegramId(commandArg(ctx.match));
        if (!targetId) {
            await ctx.reply("Использование: /admin_add <telegram_id>");
            return;
        }
        await prisma.$transaction([
            prisma.allowedUser.upsert({
                where: { telegramId: targetId },
                update: {
                    isBanned: false,
                    addedByTelegramId: adminId
                },
                create: {
                    telegramId: targetId,
                    addedByTelegramId: adminId
                }
            }),
            prisma.adminLog.create({
                data: {
                    adminTelegramId: adminId,
                    action: "admin_add",
                    targetTelegramId: targetId
                }
            })
        ]);
        await ctx.reply(`Пользователь ${targetId.toString()} добавлен в whitelist.`);
    });
    bot.command("admin_remove", async (ctx) => {
        const adminId = await requireAdmin(ctx);
        if (!adminId) {
            return;
        }
        const targetId = parseTelegramId(commandArg(ctx.match));
        if (!targetId) {
            await ctx.reply("Использование: /admin_remove <telegram_id>");
            return;
        }
        await prisma.$transaction([
            prisma.allowedUser.deleteMany({
                where: { telegramId: targetId }
            }),
            prisma.adminLog.create({
                data: {
                    adminTelegramId: adminId,
                    action: "admin_remove",
                    targetTelegramId: targetId
                }
            })
        ]);
        await ctx.reply(`Пользователь ${targetId.toString()} удален из whitelist.`);
    });
    bot.command("admin_list", async (ctx) => {
        const adminId = await requireAdmin(ctx);
        if (!adminId) {
            return;
        }
        const allowedUsers = await prisma.allowedUser.findMany({
            orderBy: {
                createdAt: "desc"
            },
            take: 30
        });
        if (allowedUsers.length === 0) {
            await ctx.reply("Whitelist пуст.");
            return;
        }
        await ctx.reply(allowedUsers
            .map((item) => `${item.telegramId.toString()} — ${item.isBanned ? "banned" : "allowed"}`)
            .join("\n"));
    });
    bot.command("admin_user", async (ctx) => {
        const adminId = await requireAdmin(ctx);
        if (!adminId) {
            return;
        }
        const targetId = parseTelegramId(commandArg(ctx.match));
        if (!targetId) {
            await ctx.reply("Использование: /admin_user <telegram_id>");
            return;
        }
        const [allowed, user] = await Promise.all([
            prisma.allowedUser.findUnique({ where: { telegramId: targetId } }),
            prisma.user.findUnique({ where: { telegramId: targetId } })
        ]);
        await ctx.reply([
            `Telegram ID: ${targetId.toString()}`,
            `Whitelist: ${allowed ? (allowed.isBanned ? "banned" : "allowed") : "нет"}`,
            `Bot started: ${user?.hasStartedBot ? "да" : "нет"}`,
            user?.username ? `Username: @${user.username}` : undefined
        ]
            .filter(Boolean)
            .join("\n"));
    });
    bot.command("admin_ban", async (ctx) => {
        const adminId = await requireAdmin(ctx);
        if (!adminId) {
            return;
        }
        const targetId = parseTelegramId(commandArg(ctx.match));
        if (!targetId) {
            await ctx.reply("Использование: /admin_ban <telegram_id>");
            return;
        }
        await prisma.$transaction([
            prisma.allowedUser.upsert({
                where: { telegramId: targetId },
                update: {
                    isBanned: true
                },
                create: {
                    telegramId: targetId,
                    isBanned: true,
                    addedByTelegramId: adminId
                }
            }),
            prisma.adminLog.create({
                data: {
                    adminTelegramId: adminId,
                    action: "admin_ban",
                    targetTelegramId: targetId
                }
            })
        ]);
        await ctx.reply(`Пользователь ${targetId.toString()} забанен.`);
    });
    bot.command("admin_unban", async (ctx) => {
        const adminId = await requireAdmin(ctx);
        if (!adminId) {
            return;
        }
        const targetId = parseTelegramId(commandArg(ctx.match));
        if (!targetId) {
            await ctx.reply("Использование: /admin_unban <telegram_id>");
            return;
        }
        await prisma.$transaction([
            prisma.allowedUser.upsert({
                where: { telegramId: targetId },
                update: {
                    isBanned: false
                },
                create: {
                    telegramId: targetId,
                    isBanned: false,
                    addedByTelegramId: adminId
                }
            }),
            prisma.adminLog.create({
                data: {
                    adminTelegramId: adminId,
                    action: "admin_unban",
                    targetTelegramId: targetId
                }
            })
        ]);
        await ctx.reply(`Пользователь ${targetId.toString()} разбанен.`);
    });
}
