import type { Pool } from "mysql2/promise";

import { llmService } from "../../ai/llm.service.js";
import { buildRecommendReasonPrompt } from "../../ai/prompts/index.js";
import { TtlCache } from "../../utils/cache.js";
import { env } from "../../config/env.js";
import { RecallService, type RecallContext } from "./recall.service.js";
import { RankingService, type RankedAttraction } from "./ranking.service.js";

export interface RecommendRequest extends RecallContext {
  days?: number;
  page?: number;
  pageSize?: number;
  skipLlm?: boolean;
}

export interface RecommendItem {
  attractionId: number;
  name: string;
  score: number;
  matchTags: string[];
  aiReason: string;
  recStrategy: string[];
  rating: number;
  priceRange: string;
}

const recommendCache = new TtlCache<RecommendItem[]>(env.recommendCacheTtl);

export class RecommendationService {
  private recall: RecallService;
  private ranking = new RankingService();

  constructor(private pool: Pool) {
    this.recall = new RecallService(pool);
  }

  async recommend(input: RecommendRequest): Promise<{
    recommendations: RecommendItem[];
    total: number;
    page: number;
  }> {
    const cacheKey = TtlCache.hashKey({ userId: input.userId, ...input, skipLlm: true });
    const cached = recommendCache.get(cacheKey);
    if (cached && !input.skipLlm) {
      return {
        recommendations: cached,
        total: cached.length,
        page: input.page ?? 1,
      };
    }

    const candidates = await this.recall.multiRecall(input);
    const rough = this.ranking.roughRank(candidates, input, 50);
    const fine = this.ranking.fineRank(rough, input, 15);

    const withReasons = input.skipLlm
      ? fine.map((item) => this.toRecommendItem(item, "根据你的偏好为你精选"))
      : await this.attachAiReasons(fine, input);

    recommendCache.set(cacheKey, withReasons);

    await this.logRecommendations(input.userId, input, withReasons);

    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 15;
    const start = (page - 1) * pageSize;

    return {
      recommendations: withReasons.slice(start, start + pageSize),
      total: withReasons.length,
      page,
    };
  }

  private toRecommendItem(item: RankedAttraction, aiReason: string): RecommendItem {
    return {
      attractionId: item.attractionId,
      name: item.name,
      score: Number(item.finalScore.toFixed(4)),
      matchTags: item.matchTags,
      aiReason,
      recStrategy: [...item.recStrategies],
      rating: item.rating,
      priceRange: `${Math.max(0, item.ticketPriceMax - 50)}-${item.ticketPriceMax}`,
    };
  }

  private async attachAiReasons(
    items: RankedAttraction[],
    input: RecommendRequest,
  ): Promise<RecommendItem[]> {
    const results: RecommendItem[] = [];

    for (const item of items) {
      const prompt = buildRecommendReasonPrompt({
        userPreferences: input.preferences,
        tripType: input.tripType,
        budget: input.budget,
        days: input.days,
        attractionName: item.name,
        attractionTags: item.tags,
        rating: item.rating,
        matchReasons: item.matchReasons,
      });

      let aiReason = "根据你的偏好为你精选";
      try {
        aiReason = (
          await llmService.complete([
            { role: "system", content: "你是专业旅游顾问，回答简洁自然。" },
            { role: "user", content: prompt },
          ])
        ).trim();
      } catch {
        aiReason = item.matchReasons.join("，") || aiReason;
      }

      results.push(this.toRecommendItem(item, aiReason));
    }

    return results;
  }

  private async logRecommendations(
    userId: number | undefined,
    input: RecommendRequest,
    items: RecommendItem[],
  ) {
    if (items.length === 0) return;

    const values = items.map((item) => [
      userId ?? null,
      JSON.stringify(input),
      item.attractionId,
      item.score,
      JSON.stringify(item.recStrategy),
      JSON.stringify(item.matchTags),
      item.aiReason,
    ]);

    const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(",");
    await this.pool.execute(
      `INSERT INTO recommendation_logs
        (user_id, request_params, attraction_id, final_score, rec_strategies, match_tags, ai_reason)
       VALUES ${placeholders}`,
      values.flat(),
    );
  }
}
