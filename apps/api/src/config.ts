import "dotenv/config";
import { z } from "zod";

const booleanEnvSchema = z
  .preprocess(
    (value) => (value === undefined ? undefined : String(value).trim().toLowerCase()),
    z.enum(["true", "false", "1", "0", "yes", "no", "on", "off"]).optional(),
  )
  .transform((value) => (value === undefined ? undefined : ["true", "1", "yes", "on"].includes(value)));

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_ORIGIN: z.string().default("http://localhost:8081,http://localhost:8082"),
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
  LOG_LEVEL: z.string().default("info"),
  JWT_SECRET: z.string().min(16).default("lazyde-dev-jwt-secret-change-me"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_LLM_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  AI_EMBEDDING_PROVIDER: z.enum(["openai", "zhipu", "siliconflow"]).default("openai"),
  AI_LLM_PROVIDER: z.enum(["openai", "zhipu", "deepseek", "siliconflow"]).default("openai"),
  ZHIPU_API_KEY: z.string().optional(),
  ZHIPU_EMBEDDING_MODEL: z.string().default("embedding-3"),
  ZHIPU_LLM_MODEL: z.string().default("glm-4-flash"),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_LLM_MODEL: z.string().default("deepseek-v4-pro"),
  SILICONFLOW_API_KEY: z.string().optional(),
  SILICONFLOW_BASE_URL: z.string().default("https://api.siliconflow.cn/v1"),
  SILICONFLOW_LLM_MODEL: z.string().default("deepseek-ai/DeepSeek-V4-Pro"),
  SILICONFLOW_EMBEDDING_MODEL: z.string().default("BAAI/bge-m3"),
  SILICONFLOW_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1024),
  QDRANT_URL: z.string().default("http://127.0.0.1:6333"),
  QDRANT_API_KEY: z.string().optional(),
  CHROMA_URL: z.string().default("http://127.0.0.1:8000"),
  CHROMA_ACTIVITY_COLLECTION: z.string().min(1).default("activity_cards"),
  CHROMA_ENABLED: booleanEnvSchema,
  RECOMMEND_CACHE_TTL: z.coerce.number().int().positive().default(900),
  AMAP_WEB_SERVICE_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["mock", "smtp", "qq"]).default("mock"),
  QQ_EMAIL: z.string().optional(),
  QQ_SMTP_AUTH_CODE: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().max(65_535).optional(),
  SMTP_SECURE: booleanEnvSchema,
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("懒得出门"),
  SMTP_REPLY_TO: z.string().optional(),
  SMS_PROVIDER: z.enum(["mock", "tencent"]).default("mock"),
  TENCENTCLOUD_SECRET_ID: z.string().optional(),
  TENCENTCLOUD_SECRET_KEY: z.string().optional(),
  TENCENT_SMS_SDK_APP_ID: z.string().optional(),
  TENCENT_SMS_SIGN_NAME: z.string().optional(),
  TENCENT_SMS_TEMPLATE_ID: z.string().optional(),
  TENCENT_SMS_TEMPLATE_PARAMS: z.string().default("code"),
  TENCENT_SMS_REGION: z.string().default("ap-guangzhou"),
  TENCENT_SMS_ENDPOINT: z.string().default("sms.tencentcloudapi.com"),
  ALIPAY_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  ALIPAY_APP_ID: z.string().optional(),
  ALIPAY_PRIVATE_KEY: z.string().optional(),
  ALIPAY_APP_PRIVATE_KEY: z.string().optional(),
  ALIPAY_PRIVATE_KEY_PATH: z.string().optional(),
  ALIPAY_PUBLIC_KEY: z.string().optional(),
  ALIPAY_ALIPAY_PUBLIC_KEY: z.string().optional(),
  ALIPAY_PUBLIC_KEY_PATH: z.string().optional(),
  ALIPAY_KEY_TYPE: z.enum(["PKCS1", "PKCS8"]).default("PKCS8"),
  ALIPAY_GATEWAY: z.string().url().optional(),
  ALIPAY_ENDPOINT: z.string().url().optional(),
  ALIPAY_NOTIFY_URL: z.string().url().optional(),
  ALIPAY_VIP_MONTH_AMOUNT_YUAN: z.coerce.number().positive().default(18),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("API 配置错误", parsed.error.flatten().fieldErrors);
  throw new Error("API 配置不完整，请检查 apps/api/.env");
}

const alipaySandboxGateway = "https://openapi-sandbox.dl.alipaydev.com/gateway.do";
const alipaySandboxEndpoint = "https://openapi-sandbox.dl.alipaydev.com";
const alipayProductionGateway = "https://openapi.alipay.com/gateway.do";
const alipayProductionEndpoint = "https://openapi.alipay.com";
const isAlipaySandbox = parsed.data.ALIPAY_ENV === "sandbox";
const isQqEmailProvider = parsed.data.EMAIL_PROVIDER === "qq";
const smtpUser = parsed.data.SMTP_USER ?? parsed.data.QQ_EMAIL ?? "";
const smtpPass = parsed.data.SMTP_PASS ?? parsed.data.QQ_SMTP_AUTH_CODE ?? "";
const smtpFrom = parsed.data.SMTP_FROM ?? smtpUser;

export const config = {
  port: parsed.data.PORT,
  clientOrigins: parsed.data.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean),
  database: {
    host: parsed.data.DB_HOST,
    port: parsed.data.DB_PORT,
    user: parsed.data.DB_USER,
    password: parsed.data.DB_PASSWORD,
    database: parsed.data.DB_NAME,
  },
  logLevel: parsed.data.LOG_LEVEL,
  jwtSecret: parsed.data.JWT_SECRET,
  ai: {
    embeddingProvider: parsed.data.AI_EMBEDDING_PROVIDER,
    llmProvider: parsed.data.AI_LLM_PROVIDER,
    openai: {
      apiKey: parsed.data.OPENAI_API_KEY ?? "",
      embeddingModel: parsed.data.OPENAI_EMBEDDING_MODEL,
      llmModel: parsed.data.OPENAI_LLM_MODEL,
      embeddingDimensions: parsed.data.OPENAI_EMBEDDING_DIMENSIONS,
    },
    zhipu: {
      apiKey: parsed.data.ZHIPU_API_KEY ?? "",
      embeddingModel: parsed.data.ZHIPU_EMBEDDING_MODEL,
      llmModel: parsed.data.ZHIPU_LLM_MODEL,
    },
    deepseek: {
      apiKey: parsed.data.DEEPSEEK_API_KEY ?? "",
      llmModel: parsed.data.DEEPSEEK_LLM_MODEL,
    },
    siliconflow: {
      apiKey: parsed.data.SILICONFLOW_API_KEY ?? "",
      baseUrl: parsed.data.SILICONFLOW_BASE_URL,
      llmModel: parsed.data.SILICONFLOW_LLM_MODEL,
      embeddingModel: parsed.data.SILICONFLOW_EMBEDDING_MODEL,
      embeddingDimensions: parsed.data.SILICONFLOW_EMBEDDING_DIMENSIONS,
    },
    qdrant: {
      url: parsed.data.QDRANT_URL,
      apiKey: parsed.data.QDRANT_API_KEY,
      collections: {
        attractions: "attractions",
        destinations: "destinations",
        users: "users",
      },
    },
    chroma: {
      enabled: parsed.data.CHROMA_ENABLED ?? true,
      url: parsed.data.CHROMA_URL,
      collections: {
        activities: parsed.data.CHROMA_ACTIVITY_COLLECTION,
      },
    },
    recommendCacheTtl: parsed.data.RECOMMEND_CACHE_TTL,
  },
  amap: {
    webServiceKey: parsed.data.AMAP_WEB_SERVICE_KEY ?? "",
  },
  email: {
    provider: parsed.data.EMAIL_PROVIDER,
    smtp: {
      host: parsed.data.SMTP_HOST ?? (isQqEmailProvider ? "smtp.qq.com" : ""),
      port: parsed.data.SMTP_PORT ?? (isQqEmailProvider ? 465 : 587),
      secure: parsed.data.SMTP_SECURE ?? isQqEmailProvider,
      user: smtpUser,
      pass: smtpPass,
      from: smtpFrom,
      fromName: parsed.data.SMTP_FROM_NAME,
      replyTo: parsed.data.SMTP_REPLY_TO ?? "",
    },
  },
  sms: {
    provider: parsed.data.SMS_PROVIDER,
    tencent: {
      secretId: parsed.data.TENCENTCLOUD_SECRET_ID ?? "",
      secretKey: parsed.data.TENCENTCLOUD_SECRET_KEY ?? "",
      smsSdkAppId: parsed.data.TENCENT_SMS_SDK_APP_ID ?? "",
      signName: parsed.data.TENCENT_SMS_SIGN_NAME ?? "",
      templateId: parsed.data.TENCENT_SMS_TEMPLATE_ID ?? "",
      templateParams: parsed.data.TENCENT_SMS_TEMPLATE_PARAMS.split(",")
        .map((param) => param.trim())
        .filter(Boolean),
      region: parsed.data.TENCENT_SMS_REGION,
      endpoint: parsed.data.TENCENT_SMS_ENDPOINT,
    },
  },
  alipay: {
    env: parsed.data.ALIPAY_ENV,
    appId: parsed.data.ALIPAY_APP_ID ?? "",
    privateKey: parsed.data.ALIPAY_PRIVATE_KEY ?? parsed.data.ALIPAY_APP_PRIVATE_KEY ?? "",
    privateKeyPath: parsed.data.ALIPAY_PRIVATE_KEY_PATH ?? "",
    alipayPublicKey: parsed.data.ALIPAY_PUBLIC_KEY ?? parsed.data.ALIPAY_ALIPAY_PUBLIC_KEY ?? "",
    alipayPublicKeyPath: parsed.data.ALIPAY_PUBLIC_KEY_PATH ?? "",
    keyType: parsed.data.ALIPAY_KEY_TYPE,
    gateway:
      parsed.data.ALIPAY_GATEWAY ??
      (isAlipaySandbox ? alipaySandboxGateway : alipayProductionGateway),
    endpoint:
      parsed.data.ALIPAY_ENDPOINT ??
      (isAlipaySandbox ? alipaySandboxEndpoint : alipayProductionEndpoint),
    notifyUrl: parsed.data.ALIPAY_NOTIFY_URL ?? "",
    vipMonthAmountYuan: parsed.data.ALIPAY_VIP_MONTH_AMOUNT_YUAN,
  },
};

export function isAiConfigured() {
  return Boolean(
    config.ai.openai.apiKey ||
      config.ai.zhipu.apiKey ||
      config.ai.siliconflow.apiKey ||
      config.ai.deepseek.apiKey,
  );
}

export function getEmbeddingModelName() {
  switch (config.ai.embeddingProvider) {
    case "zhipu":
      return config.ai.zhipu.embeddingModel;
    case "siliconflow":
      return config.ai.siliconflow.embeddingModel;
    default:
      return config.ai.openai.embeddingModel;
  }
}
