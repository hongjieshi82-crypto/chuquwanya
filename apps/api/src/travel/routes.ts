import type { Express, NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";

import { verifyAuthToken } from "../auth.js";
import { activityVectorService } from "../activityVector.service.js";
import { pool } from "../db.js";
import { AppError } from "../errors.js";
import { embeddingService } from "./ai/embedding.service.js";
import { vectorStoreService } from "./ai/vectorStore.service.js";
import { RecommendationService } from "./modules/recommendation.service.js";
import { SemanticSearchService } from "./modules/semanticSearch.service.js";
import { TripGenerationService } from "./modules/tripGeneration.service.js";
import { MultiDayComposerService } from "./modules/multiDayComposer.service.js";
import { config, getEmbeddingModelName, isAiConfigured } from "../config.js";

type AuthRequest = Request & { userId?: number };

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function authOptional(request: AuthRequest, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      request.userId = verifyAuthToken(header.slice("Bearer ".length));
    } catch {
      // 匿名用户
    }
  }
  next();
}

const recommendSchema = z.object({
  destination: z.string().optional(),
  days: z.coerce.number().int().positive().optional(),
  budget: z.coerce.number().positive().optional(),
  travelers: z.coerce.number().int().positive().optional(),
  tripType: z.string().optional(),
  preferences: z.array(z.string()).default([]),
  season: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional(),
});

const semanticSearchSchema = z.object({
  query: z.string().min(2).max(500),
  target: z.enum(["attraction", "destination", "all"]).default("all"),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

const tripGenerateSchema = z.object({
  destination: z.string().min(1),
  days: z.coerce.number().int().min(1).max(30),
  travelers: z.coerce.number().int().min(1).max(20),
  budget: z.coerce.number().positive(),
  preferences: z.array(z.string()).default([]),
  tripType: z.string().optional(),
  stream: z.boolean().default(false),
});

const tripComposeSchema = z.object({
  cityId: z.number().int().positive(),
  originName: z.string().trim().min(1).max(80).nullable().optional(),
  days: z.number().int().min(2).max(5),
  travelers: z.number().int().min(1).max(20),
  budgetMin: z.number().int().min(0).max(100_000).nullable().optional(),
  budget: z.number().int().min(0).max(100_000).nullable(),
  mood: z.string().min(1).max(32),
  budgetTier: z.enum(['budget', 'standard', 'premium', 'luxury']).optional(),
});

const recommendationService = new RecommendationService(pool);
const semanticSearchService = new SemanticSearchService(pool);
const tripGenerationService = new TripGenerationService(pool);
const multiDayComposerService = new MultiDayComposerService(pool);

export function registerTravelRoutes(app: Express) {
  app.get(
    "/api/v1/travel/status",
    asyncRoute(async (_request, response) => {
      const chromaAvailable = await activityVectorService.heartbeat();
      response.json({
        data: {
          aiConfigured: isAiConfigured(),
          llmProvider: config.ai.llmProvider,
          llmModel:
            config.ai.llmProvider === "siliconflow"
              ? config.ai.siliconflow.llmModel
              : config.ai.llmProvider === "deepseek"
                ? config.ai.deepseek.llmModel
                : config.ai.llmProvider === "zhipu"
                  ? config.ai.zhipu.llmModel
                  : config.ai.openai.llmModel,
          embedding: embeddingService.isAvailable(),
          embeddingProvider: config.ai.embeddingProvider,
          qdrantUrl: config.ai.qdrant.url,
          chromaUrl: config.ai.chroma.url,
          chromaEnabled: config.ai.chroma.enabled,
          chromaActivityCollection: config.ai.chroma.collections.activities,
          chromaAvailable,
        },
      });
    }),
  );

  app.get(
    "/api/v1/destinations",
    asyncRoute(async (request, response) => {
      const hot = z.coerce.boolean().optional().parse(request.query.hot);
      const [rows] = await pool.execute(
        `SELECT
           d.id,
           d.city_id AS cityId,
           d.name,
           d.province,
           d.summary,
           COALESCE(
             NULLIF(d.cover_image, ''),
             (
               SELECT COALESCE(NULLIF(a2.cover_image, ''), NULLIF(act2.cover_image, ''))
               FROM attractions a2
               LEFT JOIN activities act2 ON act2.id = a2.activity_id
               WHERE a2.destination_id = d.id
                 AND a2.is_active = TRUE
                 AND COALESCE(NULLIF(a2.cover_image, ''), NULLIF(act2.cover_image, '')) IS NOT NULL
               ORDER BY a2.popularity DESC, a2.rating DESC
               LIMIT 1
             )
           ) AS coverImageUri,
           d.rating,
           d.popularity,
           d.is_hot AS isHot
         FROM destinations d
         WHERE d.is_active = TRUE
           ${hot ? "AND d.is_hot = TRUE" : ""}
         ORDER BY d.popularity DESC, d.rating DESC`,
      );
      response.json({ data: rows });
    }),
  );

  app.get(
    "/api/v1/destinations/:id",
    asyncRoute(async (request, response) => {
      const id = z.coerce.number().int().positive().parse(request.params.id);
      const [rows] = await pool.execute(
        `SELECT d.*, GROUP_CONCAT(t.name) AS tags
         FROM destinations d
         LEFT JOIN destination_tags dt ON dt.destination_id = d.id
         LEFT JOIN travel_tags t ON t.id = dt.tag_id
         WHERE d.id = ? AND d.is_active = TRUE
         GROUP BY d.id`,
        [id],
      );
      const row = (rows as Array<Record<string, unknown>>)[0];
      if (!row) throw new AppError(404, "DESTINATION_NOT_FOUND", "目的地不存在");
      response.json({ data: row });
    }),
  );

  app.get(
    "/api/v1/attractions",
    asyncRoute(async (request, response) => {
      const destinationId = z.coerce.number().int().positive().optional().parse(request.query.destinationId);
      const limit = z.coerce.number().int().min(1).max(500).default(100).parse(request.query.limit);
      const params: number[] = [];
      let filter = "";
      if (destinationId) {
        filter = "AND a.destination_id = ?";
        params.push(destinationId);
      }
      const [rows] = await pool.execute(
        `SELECT a.id, a.destination_id AS destinationId, a.activity_id AS activityId, a.name, a.summary,
                COALESCE(NULLIF(a.cover_image, ''), NULLIF(act.cover_image, '')) AS coverImageUri,
                a.ticket_price_max AS ticketPriceMax, a.rating, a.suggested_duration AS suggestedDuration,
                a.popularity,
                d.name AS destinationName
         FROM attractions a
         INNER JOIN destinations d ON d.id = a.destination_id
         LEFT JOIN activities act ON act.id = a.activity_id
         WHERE a.is_active = TRUE ${filter}
         ORDER BY a.popularity DESC, a.rating DESC
         LIMIT ${limit}`,
        params,
      );
      response.json({ data: rows });
    }),
  );

  app.get(
    "/api/v1/travel/tags",
    asyncRoute(async (_request, response) => {
      const [rows] = await pool.execute(
        `SELECT id, name, category FROM travel_tags WHERE is_active = TRUE ORDER BY sort_order`,
      );
      response.json({ data: rows });
    }),
  );

  app.post(
    "/api/v1/recommendations/ai",
    authOptional,
    asyncRoute(async (request: AuthRequest, response) => {
      const body = recommendSchema.parse(request.body);
      const data = await recommendationService.recommend({ ...body, userId: request.userId });
      response.json({ data });
    }),
  );

  app.post(
    "/api/v1/search/semantic",
    authOptional,
    asyncRoute(async (request, response) => {
      const body = semanticSearchSchema.parse(request.body);
      const results = await semanticSearchService.search(body.query, body.target, body.limit);
      response.json({ data: { results, total: results.length, mode: embeddingService.isAvailable() ? "semantic" : "keyword" } });
    }),
  );

  app.post(
    "/api/v1/trips/compose",
    asyncRoute(async (request, response) => {
      const input = tripComposeSchema.parse(request.body);
      const trip = await multiDayComposerService.compose(input);
      response.status(201).json({ data: trip });
    }),
  );

  app.post(
    "/api/v1/trips/ai-generate",
    authOptional,
    asyncRoute(async (request: AuthRequest, response) => {
      const body = tripGenerateSchema.parse(request.body);
      const input = { ...body, userId: request.userId };

      if (body.stream) {
        await tripGenerationService.generateStream(input, response);
        return;
      }

      const { taskId } = await tripGenerationService.generateAsync(input);
      response.status(201).json({ data: { taskId, status: "pending" } });
    }),
  );

  app.get(
    "/api/v1/trips/ai-generate/:taskId",
    asyncRoute(async (request, response) => {
      const task = tripGenerationService.getTaskStatus(String(request.params.taskId));
      if (task.status === "not_found") {
        throw new AppError(404, "TASK_NOT_FOUND", "任务不存在");
      }
      response.json({ data: task });
    }),
  );

  app.post(
    "/api/v1/attractions/:id/embedding",
    asyncRoute(async (request, response) => {
      const id = z.coerce.number().int().positive().parse(request.params.id);
      const [rows] = await pool.execute(
        `SELECT a.id, a.destination_id, a.name, a.summary, a.embedding_point_id,
                GROUP_CONCAT(t.name) AS tags
         FROM attractions a
         LEFT JOIN attraction_tags at ON at.attraction_id = a.id
         LEFT JOIN travel_tags t ON t.id = at.tag_id
         WHERE a.id = ?
         GROUP BY a.id`,
        [id],
      );
      const row = (rows as Array<Record<string, unknown>>)[0];
      if (!row) throw new AppError(404, "ATTRACTION_NOT_FOUND", "景点不存在");

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
        [pointId, getEmbeddingModelName(), id],
      );

      response.json({ data: { attractionId: id, embeddingPointId: pointId } });
    }),
  );

  app.post(
    "/api/v1/users/me/embedding",
    authOptional,
    asyncRoute(async (request: AuthRequest, response) => {
      if (!request.userId) throw new AppError(401, "UNAUTHORIZED", "请先登录");

      const preferences = z.array(z.string()).parse(request.body.preferences ?? []);
      const tripType = z.string().optional().parse(request.body.tripType);
      const text = embeddingService.buildUserPreferenceText({ preferences, tripType });

      const pointId = await vectorStoreService.upsertUserPreference({
        userId: request.userId,
        preferenceText: text,
      });

      await pool.execute(
        `INSERT INTO user_embeddings (user_id, embedding_point_id, source_text_hash)
         VALUES (?, ?, SHA2(?, 256))
         ON DUPLICATE KEY UPDATE embedding_point_id = VALUES(embedding_point_id),
           source_text_hash = VALUES(source_text_hash),
           updated_at = CURRENT_TIMESTAMP`,
        [request.userId, pointId, text],
      );

      response.json({ data: { userId: request.userId, embeddingPointId: pointId } });
    }),
  );

  app.put(
    "/api/v1/users/me/travel-preferences",
    authOptional,
    asyncRoute(async (request: AuthRequest, response) => {
      if (!request.userId) throw new AppError(401, "UNAUTHORIZED", "请先登录");

      const schema = z.object({
        preferenceTags: z.array(z.string()).default([]),
        tripTypes: z.array(z.string()).default([]),
        budgetMin: z.number().int().nullable().optional(),
        budgetMax: z.number().int().nullable().optional(),
      });
      const body = schema.parse(request.body);

      await pool.execute(
        `INSERT INTO user_profiles (user_id, preference_tags, trip_types, budget_min, budget_max)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           preference_tags = VALUES(preference_tags),
           trip_types = VALUES(trip_types),
           budget_min = VALUES(budget_min),
           budget_max = VALUES(budget_max),
           updated_at = CURRENT_TIMESTAMP`,
        [
          request.userId,
          JSON.stringify(body.preferenceTags),
          JSON.stringify(body.tripTypes),
          body.budgetMin ?? null,
          body.budgetMax ?? null,
        ],
      );

      response.json({ data: { ok: true } });
    }),
  );
}

export { ZodError };
