import { run } from "@grammyjs/runner";
import { createBot, setBotCommands } from "./bot/index.js";
import { prisma } from "./db/prisma.js";
import { logger } from "./utils/logger.js";
const bot = createBot();
await setBotCommands(bot);
const runner = run(bot);
logger.info("Gatto D&D Telegram bot started.");
async function shutdown(signal) {
    logger.info({ signal }, "Shutting down bot.");
    await runner.stop();
    await prisma.$disconnect();
}
process.once("SIGINT", () => {
    void shutdown("SIGINT");
});
process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
});
