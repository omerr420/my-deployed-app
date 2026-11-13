import pino from "pino";
import { config } from "./config";

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: ["req.headers.authorization", "password", "token"],
  ...(config.NODE_ENV === "development" ? { transport: { target: "pino-pretty", options: { colorize: true } } } : {})
});