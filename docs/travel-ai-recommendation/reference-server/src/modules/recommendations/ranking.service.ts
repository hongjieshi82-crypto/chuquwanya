import { normalizeScore } from "../../utils/response.js";
import type { AttractionCandidate, RecallContext } from "./recall.service.js";

export interface RankedAttraction extends AttractionCandidate {
  roughScore: number;
  finalScore: number;
  matchTags: string[];
  matchReasons: string[];
}

function budgetMatch(candidate: AttractionCandidate, budget?: number, days = 1): number {
  if (!budget) return 0.7;
  const dailyBudget = budget / Math.max(days, 1);
  const ticket = candidate.ticketPriceMax;
  if (ticket <= dailyBudget * 0.3) return 1;
  if (ticket <= dailyBudget * 0.6) return 0.7;
  if (ticket <= dailyBudget) return 0.4;
  return 0.1;
}

function seasonMatch(candidate: AttractionCandidate, season?: string): number {
  if (!season || candidate.bestSeasons.length === 0) return 0.6;
  return candidate.bestSeasons.includes(season) ? 1 : 0.2;
}

function audienceMatch(candidate: AttractionCandidate, tripType?: string): number {
  if (!tripType || candidate.suitableAudiences.length === 0) return 0.6;
  return candidate.suitableAudiences.some((a) => tripType.includes(a) || a.includes(tripType))
    ? 1
    : 0.3;
}

function ratingScore(candidate: AttractionCandidate): number {
  return normalizeScore(candidate.rating, 0, 5);
}

function popularityScore(candidate: AttractionCandidate, maxPopularity: number): number {
  return normalizeScore(candidate.popularity, 0, maxPopularity || 1);
}

export class RankingService {
  /** 粗排：规则快速过滤 + Top 50 */
  roughRank(
    candidates: AttractionCandidate[],
    ctx: RecallContext,
    limit = 50,
  ): RankedAttraction[] {
    const maxPop = Math.max(...candidates.map((c) => c.popularity), 1);

    const ranked = candidates
      .map((c) => {
        const roughScore =
          budgetMatch(c, ctx.budget, ctx.days) * 0.3 +
          seasonMatch(c, ctx.season) * 0.2 +
          audienceMatch(c, ctx.tripType) * 0.2 +
          ratingScore(c) * 0.15 +
          popularityScore(c, maxPop) * 0.15;

        return {
          ...c,
          roughScore,
          finalScore: roughScore,
          matchTags: c.tags.filter((t) => ctx.preferences.includes(t)),
          matchReasons: [] as string[],
        };
      })
      .filter((c) => c.roughScore >= 0.25)
      .sort((a, b) => b.roughScore - a.roughScore)
      .slice(0, limit);

    return ranked;
  }

  /** 精排：多特征加权 Top N */
  fineRank(
    candidates: RankedAttraction[],
    ctx: RecallContext,
    limit = 15,
  ): RankedAttraction[] {
    const maxPop = Math.max(...candidates.map((c) => c.popularity), 1);

    const ranked = candidates
      .map((c) => {
        const semanticSimilarity = c.semanticScore ?? 0.5;
        const collaborativeScore = c.collaborativeScore ?? 0;
        const historyBoost = c.recStrategies.has("behavior") ? 1 : 0.3;
        const timeMatchScore = seasonMatch(c, ctx.season);

        const finalScore =
          semanticSimilarity * 0.3 +
          collaborativeScore * 0.2 +
          ratingScore(c) * 0.15 +
          popularityScore(c, maxPop) * 0.1 +
          budgetMatch(c, ctx.budget) * 0.1 +
          historyBoost * 0.1 +
          timeMatchScore * 0.05;

        const matchReasons: string[] = [];
        if (c.recStrategies.has("semantic")) matchReasons.push("语义偏好匹配");
        if (c.recStrategies.has("tag")) matchReasons.push("标签偏好匹配");
        if (c.recStrategies.has("collaborative")) matchReasons.push("相似用户也喜欢");
        if (c.recStrategies.has("behavior")) matchReasons.push("基于你的浏览/收藏历史");

        return { ...c, finalScore, matchReasons };
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);

    return ranked;
  }
}
