import { randomUUID } from "node:crypto";

import type { Pool } from "mysql2/promise";
import type { Response } from "express";

import { llmService } from "../../ai/llm.service.js";
import { buildTripGenerationPrompt } from "../../ai/prompts/index.js";

export interface TripGenerateInput {
  userId?: number;
  destination: string;
  days: number;
  travelers: number;
  budget: number;
  preferences: string[];
  tripType?: string;
}

export interface TripDayItem {
  type: "attraction" | "meal" | "transport";
  name: string;
  duration: string;
  price: string;
  tips: string;
}

export interface GeneratedTrip {
  tripTitle: string;
  summary: string;
  days: Array<{ day: number; theme: string; items: TripDayItem[] }>;
  totalBudgetEstimate: string;
  travelTips: string[];
}

const taskStore = new Map<
  string,
  { status: string; result?: GeneratedTrip; error?: string }
>();

export class TripGenerationService {
  constructor(private pool: Pool) {}

  async generateAsync(input: TripGenerateInput): Promise<{ taskId: string }> {
    const taskId = randomUUID();
    taskStore.set(taskId, { status: "pending" });

    void this.runTask(taskId, input);
    return { taskId };
  }

  getTaskStatus(taskId: string) {
    return taskStore.get(taskId) ?? { status: "not_found" };
  }

  async generateStream(input: TripGenerateInput, res: Response) {
    const taskId = randomUUID();
    const attractions = await this.fetchTopAttractions(input.destination);
    const prompt = buildTripGenerationPrompt({
      ...input,
      attractionList: attractions,
    });

    await this.pool.execute(
      `INSERT INTO ai_generation_logs (user_id, task_id, task_type, input_params, status)
       VALUES (?, ?, 'trip_generate', ?, 'running')`,
      [input.userId ?? null, taskId, JSON.stringify(input)],
    );

    const full = await llmService.stream(
      [
        { role: "system", content: "你是专业旅游规划师，只输出合法 JSON。" },
        { role: "user", content: prompt },
      ],
      res,
    );

    const parsed = this.parseTripJson(full);
    const tripId = await this.persistTrip(input, parsed, taskId);

    await this.pool.execute(
      `UPDATE ai_generation_logs
       SET status = 'completed', output_result = ?, model = ?
       WHERE task_id = ?`,
      [JSON.stringify({ ...parsed, tripId }), process.env.AI_LLM_PROVIDER ?? "openai", taskId],
    );
  }

  private async runTask(taskId: string, input: TripGenerateInput) {
    taskStore.set(taskId, { status: "running" });
    try {
      const attractions = await this.fetchTopAttractions(input.destination);
      const prompt = buildTripGenerationPrompt({ ...input, attractionList: attractions });
      const raw = await llmService.complete([
        { role: "system", content: "你是专业旅游规划师，只输出合法 JSON。" },
        { role: "user", content: prompt },
      ]);
      const parsed = this.parseTripJson(raw);
      const tripId = await this.persistTrip(input, parsed, taskId);
      taskStore.set(taskId, { status: "completed", result: { ...parsed, tripId } as GeneratedTrip & { tripId?: number } });
    } catch (error) {
      taskStore.set(taskId, {
        status: "failed",
        error: error instanceof Error ? error.message : "生成失败",
      });
    }
  }

  private async fetchTopAttractions(destination: string) {
    const [rows] = await this.pool.execute(
      `SELECT a.name, a.ticket_price_max, GROUP_CONCAT(t.name) AS tags
       FROM attractions a
       INNER JOIN destinations d ON d.id = a.destination_id
       LEFT JOIN attraction_tags at ON at.attraction_id = a.id
       LEFT JOIN tags t ON t.id = at.tag_id
       WHERE d.name LIKE ? AND a.is_active = TRUE
       GROUP BY a.id
       ORDER BY a.rating DESC, a.popularity DESC
       LIMIT 20`,
      [`%${destination}%`],
    );

    return (rows as Array<{ name: string; ticket_price_max: number; tags: string }>).map((r) => ({
      name: r.name,
      tags: (r.tags ?? "").split(",").filter(Boolean),
      price: `${r.ticket_price_max}元`,
    }));
  }

  parseTripJson(raw: string): GeneratedTrip {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as GeneratedTrip;
    if (!parsed.days?.length) throw new Error("LLM 返回的行程 JSON 无效");
    return parsed;
  }

  private async persistTrip(input: TripGenerateInput, trip: GeneratedTrip, taskId: string) {
    const [destRows] = await this.pool.execute(
      "SELECT id FROM destinations WHERE name LIKE ? LIMIT 1",
      [`%${input.destination}%`],
    );
    const destinationId = (destRows as Array<{ id: number }>)[0]?.id ?? null;

    const [result] = await this.pool.execute(
      `INSERT INTO trips
        (user_id, destination_id, title, days, travelers, budget, trip_type, preferences, source, ai_task_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ai_generated', ?, 'draft')`,
      [
        input.userId ?? null,
        destinationId,
        trip.tripTitle,
        input.days,
        input.travelers,
        input.budget,
        input.tripType ?? null,
        JSON.stringify(input.preferences),
        taskId,
      ],
    );
    const tripId = (result as { insertId: number }).insertId;

    for (const day of trip.days) {
      let sort = 0;
      for (const item of day.items) {
        await this.pool.execute(
          `INSERT INTO trip_items
            (trip_id, day_no, sort_order, item_type, name, duration, price, tips, theme)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tripId,
            day.day,
            sort++,
            item.type,
            item.name,
            item.duration,
            item.price,
            item.tips,
            day.theme,
          ],
        );
      }
    }

    return tripId;
  }
}
