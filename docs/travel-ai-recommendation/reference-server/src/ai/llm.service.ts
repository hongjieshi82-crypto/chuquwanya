import OpenAI from "openai";
import type { Response } from "express";

import { env } from "../config/env.js";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  complete(messages: LlmMessage[], options?: { temperature?: number }): Promise<string>;
  stream(messages: LlmMessage[], res: Response): Promise<string>;
}

class OpenAiLlmProvider implements LlmProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.ai.openai.apiKey });
  }

  async complete(messages: LlmMessage[], options?: { temperature?: number }) {
    const response = await this.client.chat.completions.create({
      model: env.ai.openai.llmModel,
      messages,
      temperature: options?.temperature ?? 0.7,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(messages: LlmMessage[], res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const stream = await this.client.chat.completions.create({
      model: env.ai.openai.llmModel,
      messages,
      stream: true,
      temperature: 0.7,
    });

    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (!delta) continue;
      full += delta;
      res.write(`data: ${JSON.stringify({ delta, done: false })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ delta: "", done: true, full })}\n\n`);
    res.end();
    return full;
  }
}

class DeepSeekLlmProvider implements LlmProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.ai.deepseek.apiKey,
      baseURL: "https://api.deepseek.com",
    });
  }

  async complete(messages: LlmMessage[]) {
    const response = await this.client.chat.completions.create({
      model: env.ai.deepseek.llmModel,
      messages,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(messages: LlmMessage[], res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const stream = await this.client.chat.completions.create({
      model: env.ai.deepseek.llmModel,
      messages,
      stream: true,
    });

    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (!delta) continue;
      full += delta;
      res.write(`data: ${JSON.stringify({ delta, done: false })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ delta: "", done: true, full })}\n\n`);
    res.end();
    return full;
  }
}

class ZhipuLlmProvider implements LlmProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.ai.zhipu.apiKey,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    });
  }

  async complete(messages: LlmMessage[]) {
    const response = await this.client.chat.completions.create({
      model: env.ai.zhipu.llmModel,
      messages,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(messages: LlmMessage[], res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const stream = await this.client.chat.completions.create({
      model: env.ai.zhipu.llmModel,
      messages,
      stream: true,
    });

    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (!delta) continue;
      full += delta;
      res.write(`data: ${JSON.stringify({ delta, done: false })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ delta: "", done: true, full })}\n\n`);
    res.end();
    return full;
  }
}

function createLlmProvider(): LlmProvider {
  switch (env.ai.llmProvider) {
    case "deepseek":
      return new DeepSeekLlmProvider();
    case "zhipu":
      return new ZhipuLlmProvider();
    default:
      return new OpenAiLlmProvider();
  }
}

const provider = createLlmProvider();

export const llmService = {
  complete: (messages: LlmMessage[], options?: { temperature?: number }) =>
    provider.complete(messages, options),
  stream: (messages: LlmMessage[], res: Response) => provider.stream(messages, res),
};
