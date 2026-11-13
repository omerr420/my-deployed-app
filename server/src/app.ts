import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { config } from "./config";
import { logger } from "./logger";

export const prisma = new PrismaClient();
export const app = express();

app.use(cors({ origin: config.CLIENT_URL }));
app.use(express.json({ limit: "100kb" }));
app.use(pinoHttp({
  logger,
  genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID(),
  customProps: (req) => ({ requestId: (req as typeof req & { id?: string }).id })
}));

app.get("/api/health", async (_req, res) => {
  const memory = process.memoryUsage();
  const memoryRatio = memory.heapTotal ? memory.heapUsed / memory.heapTotal : 0;
  let database: "ok" | "down" = "ok";
  try { await prisma.$queryRaw`SELECT 1`; } catch { database = "down"; }
  const status = database === "down" ? "degraded" : memoryRatio > 0.8 ? "degraded" : "ok";
  res.status(status === "ok" ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    checks: { database, memory: memoryRatio > 0.8 ? "warning" : "ok" }
  });
});

app.get("/api/posts", async (_req, res, next) => {
  try { res.json(await prisma.post.findMany({ orderBy: { createdAt: "desc" } })); }
  catch (error) { next(error); }
});

app.post("/api/posts", async (req, res, next) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!title || !content || title.length > 120) {
      return res.status(400).json({ error: "A title (1-120 characters) and content are required." });
    }
    res.status(201).json(await prisma.post.create({ data: { title, content } }));
  } catch (error) { next(error); }
});

app.delete("/api/posts/:id", async (req, res, next) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err: error }, "Request failed");
  res.status(500).json({ error: "Internal server error" });
});

if (config.NODE_ENV === "production") {
  const path = require("node:path");
  app.use(express.static(path.join(__dirname, "../../client/dist")));
  app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "../../client/dist/index.html")));
}