import OpenAI from "openai";
import type { Response } from "express";

import { config, isAiConfigured } from "../../config.js";
import { AppError } from "../../errors.js";

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
    this.client = new OpenAI({ apiKey: config.ai.openai.apiKey });
  }

  async complete(messages: LlmMessage[], options?: { temperature?: number }) {
    const response = await this.client.chat.completions.create({
      model: config.ai.openai.llmModel,
      messages,
      temperature: options?.temperature ?? 0.7,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(messages: LlmMessage[], res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await this.client.chat.completions.create({
      model: config.ai.openai.llmModel,
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
      apiKey: config.ai.deepseek.apiKey,
      baseURL: "https://api.deepseek.com",
    });
  }

  async complete(messages: LlmMessage[]) {
    const response = await this.client.chat.completions.create({
      model: config.ai.deepseek.llmModel,
      messages,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(messages: LlmMessage[], res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await this.client.chat.completions.create({
      model: config.ai.deepseek.llmModel,
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
      apiKey: config.ai.zhipu.apiKey,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    });
  }

  async complete(messages: LlmMessage[]) {
    const response = await this.client.chat.completions.create({
      model: config.ai.zhipu.llmModel,
      messages,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(messages: LlmMessage[], res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await this.client.chat.completions.create({
      model: config.ai.zhipu.llmModel,
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

class SiliconFlowLlmProvider implements LlmProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.siliconflow.apiKey,
      baseURL: config.ai.siliconflow.baseUrl,
    });
  }

  async complete(messages: LlmMessage[], options?: { temperature?: number }) {
    const response = await this.client.chat.completions.create({
      model: config.ai.siliconflow.llmModel,
      messages,
      temperature: options?.temperature ?? 0.7,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async stream(messages: LlmMessage[], res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await this.client.chat.completions.create({
      model: config.ai.siliconflow.llmModel,
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

function createLlmProvider(): LlmProvider | null {
  if (!isAiConfigured()) return null;
  switch (config.ai.llmProvider) {
    case "deepseek":
      return config.ai.deepseek.apiKey ? new DeepSeekLlmProvider() : null;
    case "zhipu":
      return config.ai.zhipu.apiKey ? new ZhipuLlmProvider() : null;
    case "siliconflow":
      return config.ai.siliconflow.apiKey ? new SiliconFlowLlmProvider() : null;
    default:
      return config.ai.openai.apiKey ? new OpenAiLlmProvider() : null;
  }
}

const provider = createLlmProvider();

export const llmService = {
  isAvailable: () => provider !== null,

  async complete(messages: LlmMessage[], options?: { temperature?: number }) {
    if (!provider) {
      throw new AppError(503, "AI_NOT_CONFIGURED", "未配置 LLM API");
    }
    return provider.complete(messages, options);
  },

  async stream(messages: LlmMessage[], res: Response) {
    if (!provider) {
      throw new AppError(503, "AI_NOT_CONFIGURED", "未配置 LLM API");
    }
    return provider.stream(messages, res);
  },
};
