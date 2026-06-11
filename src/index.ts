import { createServer } from "node:http";
import { run } from "@grammyjs/runner";
import { config } from "./config/env.js";
import { createBot, setBotCommands } from "./bot/index.js";
import { prisma } from "./db/prisma.js";
import { logger } from "./utils/logger.js";

const bot = createBot();
const healthServer = createServer((request, response) => {
  const isHealthRoute = request.url === "/" || request.url === "/health";

  response.statusCode = isHealthRoute ? 200 : 404;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(
    JSON.stringify({
      ok: isHealthRoute,
      service: "bot-dnd-gtg"
    })
  );
});

await setBotCommands(bot);

const runner = run(bot);
logger.info("Gatto D&D Telegram bot started.");

await new Promise<void>((resolve, reject) => {
  healthServer.once("error", reject);
  healthServer.listen(config.port, "0.0.0.0", () => {
    healthServer.off("error", reject);
    logger.info({ port: config.port }, "Health server listening.");
    resolve();
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down bot.");
  await runner.stop();
  await new Promise<void>((resolve, reject) => {
    healthServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
  await prisma.$disconnect();
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
