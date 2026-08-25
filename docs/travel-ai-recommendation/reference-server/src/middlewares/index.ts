import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { fail } from "../utils/response.js";

export interface AuthRequest extends Request {
  userId?: number;
}

export function authOptional(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), env.jwtSecret) as jwt.JwtPayload;
      const sub = payload.sub;
      if (typeof sub === "number") req.userId = sub;
      else if (typeof sub === "string") req.userId = Number(sub);
    } catch {
      // 忽略无效 token，按匿名用户处理
    }
  }
  next();
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    fail(res, 400, 40001, "参数错误");
    return;
  }
  console.error(err);
  fail(res, 500, 50000, "服务暂时不可用");
}
