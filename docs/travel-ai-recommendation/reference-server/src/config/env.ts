import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3002),
  nodeEnv: process.env.NODE_ENV ?? "development",
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: required("DB_USER", "root"),
    password: process.env.DB_PASSWORD ?? "",
    database: required("DB_NAME", "travel_ai"),
  },
  jwtSecret: required("JWT_SECRET", "dev-secret-change-in-production"),
  qdrant: {
    url: process.env.QDRANT_URL ?? "http://127.0.0.1:6333",
    apiKey: process.env.QDRANT_API_KEY,
    collections: {
      attractions: process.env.QDRANT_COLLECTION_ATTRACTIONS ?? "attractions",
      destinations: process.env.QDRANT_COLLECTION_DESTINATIONS ?? "destinations",
      users: process.env.QDRANT_COLLECTION_USERS ?? "users",
    },
  },
  ai: {
    embeddingProvider: (process.env.AI_EMBEDDING_PROVIDER ?? "openai") as
      | "openai"
      | "zhipu",
    llmProvider: (process.env.AI_LLM_PROVIDER ?? "openai") as
      | "openai"
      | "zhipu"
      | "deepseek",
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? "",
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      llmModel: process.env.OPENAI_LLM_MODEL ?? "gpt-4o-mini",
      embeddingDimensions: Number(process.env.OPENAI_EMBEDDING_DIMENSIONS ?? 1536),
    },
    zhipu: {
      apiKey: process.env.ZHIPU_API_KEY ?? "",
      embeddingModel: process.env.ZHIPU_EMBEDDING_MODEL ?? "embedding-3",
      llmModel: process.env.ZHIPU_LLM_MODEL ?? "glm-4-flash",
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY ?? "",
      llmModel: process.env.DEEPSEEK_LLM_MODEL ?? "deepseek-chat",
    },
  },
  recommendCacheTtl: Number(process.env.RECOMMEND_CACHE_TTL ?? 900),
  redisUrl: process.env.REDIS_URL,
};
