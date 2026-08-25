import { Router } from "express";
import { z } from "zod";

import { pool } from "../config/db.js";
import { authOptional, type AuthRequest } from "../middlewares/index.js";
import { RecommendationService } from "../modules/recommendations/recommendation.service.js";
import { SemanticSearchService } from "../modules/search/semanticSearch.service.js";
import { TripGenerationService } from "../modules/trips/tripGeneration.service.js";
import { embeddingService } from "../ai/embedding.service.js";
import { vectorStoreService } from "../ai/vectorStore.service.js";
import { success, fail } from "../utils/response.js";

const recommendSchema = z.object({
  destination: z.string().optional(),
  days: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
  travelers: z.number().int().positive().optional(),
  tripType: z.string().optional(),
  preferences: z.array(z.string()).default([]),
  season: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(50).optional(),
});

const semanticSearchSchema = z.object({
  query: z.string().min(2).max(500),
  target: z.enum(["attraction", "destination", "all"]).default("all"),
  limit: z.number().int().positive().max(50).default(20),
});

const tripGenerateSchema = z.object({
  destination: z.string().min(1),
  days: z.number().int().min(1).max(30),
  travelers: z.number().int().min(1).max(20),
  budget: z.number().positive(),
  preferences: z.array(z.string()).default([]),
  tripType: z.string().optional(),
  stream: z.boolean().default(true),
});

export function createAiRouter() {
  const router = Router();
  const recommendationService = new RecommendationService(pool);
  const semanticSearchService = new SemanticSearchService(pool);
  const tripGenerationService = new TripGenerationService(pool);

  router.post("/recommendations/ai", authOptional, async (req: AuthRequest, res, next) => {
    try {
      const body = recommendSchema.parse(req.body);
      const data = await recommendationService.recommend({
        ...body,
        userId: req.userId,
      });
      success(res, data);
    } catch (e) {
      next(e);
    }
  });

  router.post("/search/semantic", authOptional, async (req, res, next) => {
    try {
      const body = semanticSearchSchema.parse(req.body);
      const results = await semanticSearchService.search(body.query, body.target, body.limit);
      success(res, { results, total: results.length });
    } catch (e) {
      next(e);
    }
  });

  router.post("/trips/ai-generate", authOptional, async (req: AuthRequest, res, next) => {
    try {
      const body = tripGenerateSchema.parse(req.body);
      const input = { ...body, userId: req.userId };

      if (body.stream) {
        await tripGenerationService.generateStream(input, res);
        return;
      }

      const { taskId } = await tripGenerationService.generateAsync(input);
      success(res, { taskId, status: "pending" });
    } catch (e) {
      next(e);
    }
  });

  router.get("/trips/ai-generate/:taskId", async (req, res, next) => {
    try {
      const task = tripGenerationService.getTaskStatus(req.params.taskId!);
      if (task.status === "not_found") {
        fail(res, 404, 40404, "任务不存在");
        return;
      }
      success(res, task);
    } catch (e) {
      next(e);
    }
  });

  router.post("/attractions/:id/embedding", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const [rows] = await pool.execute(
        `SELECT a.id, a.destination_id, a.name, a.summary, a.embedding_point_id,
                GROUP_CONCAT(t.name) AS tags
         FROM attractions a
         LEFT JOIN attraction_tags at ON at.attraction_id = a.id
         LEFT JOIN tags t ON t.id = at.tag_id
         WHERE a.id = ?
         GROUP BY a.id`,
        [id],
      );
      const row = (rows as Array<Record<string, unknown>>)[0];
      if (!row) {
        fail(res, 404, 40404, "景点不存在");
        return;
      }

      const pointId = await vectorStoreService.upsertAttraction({
        attractionId: id,
        destinationId: Number(row.destination_id),
        name: String(row.name),
        summary: String(row.summary),
        tags: String(row.tags ?? "").split(",").filter(Boolean),
        pointId: row.embedding_point_id ? String(row.embedding_point_id) : undefined,
      });

      await pool.execute(
        "UPDATE attractions SET embedding_point_id = ?, embedding_model = ? WHERE id = ?",
        [pointId, process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small", id],
      );

      success(res, { attractionId: id, embeddingPointId: pointId });
    } catch (e) {
      next(e);
    }
  });

  router.post("/users/me/embedding", authOptional, async (req: AuthRequest, res, next) => {
    try {
      if (!req.userId) {
        fail(res, 401, 40100, "请先登录");
        return;
      }

      const preferences = z.array(z.string()).parse(req.body.preferences ?? []);
      const tripType = z.string().optional().parse(req.body.tripType);
      const text = embeddingService.buildUserPreferenceText({ preferences, tripType });

      const pointId = await vectorStoreService.upsertUserPreference({
        userId: req.userId,
        preferenceText: text,
      });

      await pool.execute(
        `INSERT INTO user_embeddings (user_id, embedding_point_id, source_text_hash)
         VALUES (?, ?, SHA2(?, 256))
         ON DUPLICATE KEY UPDATE embedding_point_id = VALUES(embedding_point_id),
           source_text_hash = VALUES(source_text_hash),
           updated_at = CURRENT_TIMESTAMP`,
        [req.userId, pointId, text],
      );

      success(res, { userId: req.userId, embeddingPointId: pointId });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
