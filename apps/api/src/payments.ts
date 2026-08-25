import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AlipaySdk } from "alipay-sdk";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import type { PoolConnection } from "mysql2/promise";
import { z } from "zod";

import { verifyAuthToken } from "./auth.js";
import { config } from "./config.js";
import { pool, withTransaction } from "./db.js";
import { AppError } from "./errors.js";

type OrderStatus = "pending" | "paid" | "closed" | "failed";

type MembershipOrderRow = {
  id: number;
  order_no: string;
  user_id: number;
  product_code: string;
  provider_trade_no: string | null;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  paid_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type AlipayTradeQueryResult = {
  code?: string;
  msg?: string;
  subCode?: string;
  subMsg?: string;
  outTradeNo?: string;
  tradeNo?: string;
  totalAmount?: string;
  tradeStatus?: string;
  sendPayDate?: string;
};

const paidTradeStatuses = new Set(["TRADE_SUCCESS", "TRADE_FINISHED"]);
const closedTradeStatuses = new Set(["TRADE_CLOSED"]);
const vipProductCode = "vip_month";
const createVipPaymentSchema = z.object({
  returnUrl: z.string().url().optional(),
});
const orderNoParamSchema = z.object({
  orderNo: z.string().trim().min(1).max(64),
});

let alipaySdk: AlipaySdk | null = null;

function asyncRoute(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}

function readAuthenticatedUserId(request: Request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }

  try {
    return verifyAuthToken(authorization.slice("Bearer ".length));
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "登录已过期，请重新登录");
  }
}

function normalizePem(value: string) {
  return value.replace(/\\n/g, "\n").trim();
}

function readConfiguredPem(inlineValue: string, filePath: string, label: string) {
  let raw = "";
  if (inlineValue) {
    raw = inlineValue;
  } else if (filePath) {
    try {
      raw = readFileSync(resolve(process.cwd(), filePath), "utf8");
    } catch {
      throw new AppError(503, "ALIPAY_KEY_FILE_NOT_FOUND", `支付宝密钥文件读取失败：${label}`, {
        path: filePath,
      });
    }
  }

  const value = normalizePem(raw);
  if (!value) {
    throw new AppError(503, "ALIPAY_NOT_CONFIGURED", "支付宝沙箱未配置，请先补齐支付密钥", {
      missing: [label],
    });
  }
  return value;
}

function requireAlipaySdk() {
  const missing: string[] = [];
  if (!config.alipay.appId) missing.push("ALIPAY_APP_ID");
  if (!config.alipay.privateKey && !config.alipay.privateKeyPath) {
    missing.push("ALIPAY_PRIVATE_KEY 或 ALIPAY_PRIVATE_KEY_PATH");
  }
  if (!config.alipay.alipayPublicKey && !config.alipay.alipayPublicKeyPath) {
    missing.push("ALIPAY_PUBLIC_KEY 或 ALIPAY_PUBLIC_KEY_PATH");
  }

  if (missing.length) {
    throw new AppError(503, "ALIPAY_NOT_CONFIGURED", "支付宝沙箱未配置，请先补齐支付参数", {
      env: config.alipay.env,
      missing,
    });
  }

  if (!alipaySdk) {
    alipaySdk = new AlipaySdk({
      appId: config.alipay.appId,
      privateKey: readConfiguredPem(
        config.alipay.privateKey,
        config.alipay.privateKeyPath,
        "ALIPAY_PRIVATE_KEY",
      ),
      alipayPublicKey: readConfiguredPem(
        config.alipay.alipayPublicKey,
        config.alipay.alipayPublicKeyPath,
        "ALIPAY_PUBLIC_KEY",
      ),
      keyType: config.alipay.keyType,
      gateway: config.alipay.gateway,
      endpoint: config.alipay.endpoint,
      signType: "RSA2",
    });
  }

  return alipaySdk;
}

function amountYuanToCents(value: number | string) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Math.round(numberValue * 100);
}

function formatAmountYuan(cents: number) {
  return (cents / 100).toFixed(2);
}

function createOrderNo() {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `VIP${timestamp}${suffix}`;
}

function toIsoString(value: Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toOrderDto(order: MembershipOrderRow) {
  return {
    orderNo: order.order_no,
    productCode: order.product_code,
    provider: "alipay" as const,
    providerTradeNo: order.provider_trade_no,
    amountYuan: formatAmountYuan(order.amount_cents),
    currency: order.currency,
    status: order.status,
    paidAt: toIsoString(order.paid_at),
    createdAt: toIsoString(order.created_at),
    updatedAt: toIsoString(order.updated_at),
  };
}

function isAllowedReturnUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  if (config.clientOrigins.includes("*")) {
    return true;
  }

  return config.clientOrigins.some((origin) => {
    try {
      return new URL(origin).origin === url.origin;
    } catch {
      return false;
    }
  });
}

function resolveReturnUrl(input?: string) {
  if (input) {
    if (!isAllowedReturnUrl(input)) {
      throw new AppError(400, "INVALID_RETURN_URL", "支付返回地址不在允许范围内");
    }
    return input;
  }

  const [firstOrigin] = config.clientOrigins;
  return firstOrigin ? `${firstOrigin}/vip` : undefined;
}

async function ensureRegisteredUser(userId: number) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM users
     WHERE id = ? AND auth_type = 'registered'`,
    [userId],
  );
  if (!(rows as Array<{ id: number }>)[0]) {
    throw new AppError(401, "UNAUTHORIZED", "请先登录");
  }
}

async function findOrderForUser(orderNo: string, userId: number) {
  const [rows] = await pool.execute(
    `SELECT id, order_no, user_id, product_code, provider_trade_no, amount_cents,
            currency, status, paid_at, created_at, updated_at
     FROM membership_orders
     WHERE order_no = ? AND user_id = ?`,
    [orderNo, userId],
  );
  return (rows as MembershipOrderRow[])[0] ?? null;
}

async function findOrder(orderNo: string) {
  const [rows] = await pool.execute(
    `SELECT id, order_no, user_id, product_code, provider_trade_no, amount_cents,
            currency, status, paid_at, created_at, updated_at
     FROM membership_orders
     WHERE order_no = ?`,
    [orderNo],
  );
  return (rows as MembershipOrderRow[])[0] ?? null;
}

async function grantVipMonth(connection: PoolConnection, userId: number) {
  const [rows] = await connection.execute(
    `SELECT id, expires_at
     FROM user_memberships
     WHERE user_id = ?
       AND tier = 'vip'
       AND status = 'active'
       AND starts_at <= CURRENT_TIMESTAMP
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
     ORDER BY expires_at IS NULL DESC, expires_at DESC
     LIMIT 1
     FOR UPDATE`,
    [userId],
  );
  const activeMembership = (rows as Array<{ id: number; expires_at: Date | string | null }>)[0];

  if (activeMembership?.expires_at === null) {
    return;
  }

  if (activeMembership) {
    await connection.execute(
      `UPDATE user_memberships
       SET expires_at = DATE_ADD(expires_at, INTERVAL 1 MONTH)
       WHERE id = ?`,
      [activeMembership.id],
    );
    return;
  }

  await connection.execute(
    `INSERT INTO user_memberships (user_id, tier, status, starts_at, expires_at)
     VALUES (?, 'vip', 'active', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH))`,
    [userId],
  );
}

async function markOrderPaid(input: {
  orderNo: string;
  providerTradeNo?: string | null;
  totalAmount?: string | null;
  paidAt?: string | null;
  rawPayload: unknown;
}) {
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT id, order_no, user_id, amount_cents, status
       FROM membership_orders
       WHERE order_no = ?
       FOR UPDATE`,
      [input.orderNo],
    );
    const order = (
      rows as Array<{
        id: number;
        order_no: string;
        user_id: number;
        amount_cents: number;
        status: OrderStatus;
      }>
    )[0];

    if (!order) {
      throw new AppError(404, "PAYMENT_ORDER_NOT_FOUND", "支付订单不存在");
    }

    const paidAmountCents = input.totalAmount ? amountYuanToCents(input.totalAmount) : order.amount_cents;
    if (paidAmountCents !== order.amount_cents) {
      throw new AppError(400, "ALIPAY_AMOUNT_MISMATCH", "支付宝支付金额与订单金额不一致");
    }

    if (order.status === "paid") {
      return;
    }

    if (order.status !== "pending") {
      throw new AppError(409, "PAYMENT_ORDER_CLOSED", "这个支付订单已关闭");
    }

    await connection.execute(
      `UPDATE membership_orders
       SET status = 'paid',
           provider_trade_no = COALESCE(?, provider_trade_no),
           paid_at = COALESCE(?, CURRENT_TIMESTAMP),
           raw_notify_json = ?
       WHERE id = ?`,
      [
        input.providerTradeNo ?? null,
        input.paidAt ?? null,
        JSON.stringify(input.rawPayload),
        order.id,
      ],
    );

    await grantVipMonth(connection, order.user_id);
  });
}

async function markOrderClosed(orderNo: string, rawPayload: unknown) {
  await pool.execute(
    `UPDATE membership_orders
     SET status = 'closed',
         raw_notify_json = ?
     WHERE order_no = ? AND status = 'pending'`,
    [JSON.stringify(rawPayload), orderNo],
  );
}

async function refreshPendingOrderFromAlipay(order: MembershipOrderRow) {
  if (order.status !== "pending") {
    return order;
  }

  const sdk = requireAlipaySdk();
  let result: AlipayTradeQueryResult;

  try {
    result = (await sdk.exec(
      "alipay.trade.query",
      {
        bizContent: {
          outTradeNo: order.order_no,
        },
      },
      { validateSign: true },
    )) as AlipayTradeQueryResult;
  } catch {
    return order;
  }

  if (paidTradeStatuses.has(result.tradeStatus ?? "")) {
    await markOrderPaid({
      orderNo: order.order_no,
      providerTradeNo: result.tradeNo ?? null,
      totalAmount: result.totalAmount ?? null,
      paidAt: result.sendPayDate ?? null,
      rawPayload: result,
    });
    return (await findOrder(order.order_no)) ?? order;
  }

  if (closedTradeStatuses.has(result.tradeStatus ?? "")) {
    await markOrderClosed(order.order_no, result);
    return (await findOrder(order.order_no)) ?? order;
  }

  return order;
}

function normalizeNotifyBody(body: unknown) {
  const payload: Record<string, string> = {};
  if (!body || typeof body !== "object") {
    return payload;
  }

  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      payload[key] = String(value[0] ?? "");
    } else if (value !== undefined && value !== null) {
      payload[key] = String(value);
    }
  }
  return payload;
}

async function handleAlipayNotify(request: Request) {
  const sdk = requireAlipaySdk();
  const payload = normalizeNotifyBody(request.body);

  if (!sdk.checkNotifySignV2(payload)) {
    request.log.warn({ orderNo: payload.out_trade_no }, "支付宝通知验签失败");
    return false;
  }

  if (payload.app_id !== config.alipay.appId) {
    request.log.warn({ appId: payload.app_id }, "支付宝通知 app_id 不匹配");
    return false;
  }

  const orderNo = payload.out_trade_no;
  if (!orderNo) {
    return false;
  }

  if (paidTradeStatuses.has(payload.trade_status ?? "")) {
    await markOrderPaid({
      orderNo,
      providerTradeNo: payload.trade_no ?? null,
      totalAmount: payload.total_amount ?? null,
      paidAt: payload.gmt_payment ?? null,
      rawPayload: payload,
    });
    return true;
  }

  if (closedTradeStatuses.has(payload.trade_status ?? "")) {
    await markOrderClosed(orderNo, payload);
    return true;
  }

  return true;
}

export function registerPaymentRoutes(app: Express) {
  app.post(
    "/api/v1/payments/alipay/vip-month",
    asyncRoute(async (request, response) => {
      const userId = readAuthenticatedUserId(request);
      await ensureRegisteredUser(userId);
      const input = createVipPaymentSchema.parse(request.body ?? {});
      const amountCents = amountYuanToCents(config.alipay.vipMonthAmountYuan);
      if (!amountCents || amountCents <= 0) {
        throw new AppError(500, "VIP_PRICE_INVALID", "会员价格配置不正确");
      }

      const sdk = requireAlipaySdk();
      const orderNo = createOrderNo();
      const returnUrl = resolveReturnUrl(input.returnUrl);

      await pool.execute(
        `INSERT INTO membership_orders (order_no, user_id, product_code, amount_cents)
         VALUES (?, ?, ?, ?)`,
        [orderNo, userId, vipProductCode, amountCents],
      );

      const paymentUrl = sdk.pageExecute("alipay.trade.page.pay", "GET", {
        bizContent: {
          outTradeNo: orderNo,
          productCode: "FAST_INSTANT_TRADE_PAY",
          subject: "懒得动奇遇会员月卡",
          body: "奇遇会员 1 个月",
          totalAmount: formatAmountYuan(amountCents),
        },
        ...(returnUrl ? { returnUrl } : {}),
        ...(config.alipay.notifyUrl ? { notifyUrl: config.alipay.notifyUrl } : {}),
      });

      response.status(201).json({
        data: {
          orderNo,
          paymentUrl,
          amountYuan: formatAmountYuan(amountCents),
          provider: "alipay",
          env: config.alipay.env,
        },
      });
    }),
  );

  app.get(
    "/api/v1/payments/orders/:orderNo",
    asyncRoute(async (request, response) => {
      const userId = readAuthenticatedUserId(request);
      const params = orderNoParamSchema.parse(request.params);
      const order = await findOrderForUser(params.orderNo, userId);
      if (!order) {
        throw new AppError(404, "PAYMENT_ORDER_NOT_FOUND", "支付订单不存在");
      }

      const refreshed = await refreshPendingOrderFromAlipay(order);
      response.json({ data: toOrderDto(refreshed) });
    }),
  );

  app.post(
    "/api/v1/payments/alipay/notify",
    express.urlencoded({ extended: false, limit: "1mb" }),
    asyncRoute(async (request, response) => {
      let success = false;
      try {
        success = await handleAlipayNotify(request);
      } catch (error) {
        request.log.error({ err: error }, "处理支付宝通知失败");
      }

      response.type("text/plain").send(success ? "success" : "failure");
    }),
  );
}
