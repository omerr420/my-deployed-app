import { createServer } from "node:http";
import { app, prisma } from "./app";
import { config } from "./config";
import { logger } from "./logger";

const server = createServer(app);
server.listen(config.PORT, "0.0.0.0", () => logger.info({ port: config.PORT }, "Server started"));

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Graceful shutdown started");
  const forceExit = setTimeout(() => { logger.error("Shutdown timed out"); process.exit(1); }, 10000);
  forceExit.unref();
  server.close(async (error) => {
    try {
      await prisma.$disconnect();
      if (error) throw error;
      clearTimeout(forceExit);
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Shutdown failed");
      process.exit(1);
    }
  });
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));