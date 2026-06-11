import pino from "pino";
import { config } from "../config/env.js";
const loggerOptions = config.nodeEnv === "development"
    ? {
        level: config.logLevel,
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard"
            }
        }
    }
    : {
        level: config.logLevel
    };
export const logger = pino(loggerOptions);
