import { Bot } from "grammy";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { registerAdminCommands } from "./commands/admin.js";
import { registerEventCommands } from "./commands/events.js";
import { registerPrivateCommands } from "./commands/private.js";
import { registerCallbacks } from "./callbacks/index.js";
import type { AppContext } from "./types.js";

export function createBot(): Bot<AppContext> {
  const bot = new Bot<AppContext>(config.botToken);

  registerAdminCommands(bot);
  registerPrivateCommands(bot);
  registerEventCommands(bot);
  registerCallbacks(bot);

  bot.catch((error) => {
    logger.error(
      {
        error: error.error,
        update: error.ctx.update
      },
      "Bot update failed"
    );
  });

  return bot;
}

export async function setBotCommands(bot: Bot<AppContext>): Promise<void> {
  await bot.api.setMyCommands([
    { command: "start", description: "Запуск лички и проверка доступа" },
    { command: "help", description: "Помощь" },
    { command: "create", description: "Создать аватара" },
    { command: "profile", description: "Профиль аватара" },
    { command: "class", description: "Классы и смена класса" },
    { command: "inventory", description: "Инвентарь" },
    { command: "pet", description: "Питомцы" },
    { command: "event_start", description: "Админ: начать событие" },
    { command: "event_status", description: "Статус события" },
    { command: "event_join", description: "Вступить в событие" },
    { command: "death_save", description: "Бросок смерти d6" }
  ]);
}
