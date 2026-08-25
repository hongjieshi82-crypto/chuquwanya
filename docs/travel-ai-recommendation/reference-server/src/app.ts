import cors from "cors";
import express from "express";
import helmet from "helmet";

import { pool } from "./config/db.js";
import { errorHandler } from "./middlewares/index.js";
import { createAiRouter } from "./routes/ai.routes.js";
import { success } from "./utils/response.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", async (_req, res) => {
    await pool.query("SELECT 1");
    success(res, { ok: true, service: "travel-ai-api" });
  });

  app.use("/api", createAiRouter());

  app.use(errorHandler);
  return app;
}
