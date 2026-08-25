import nodemailer, { type Transporter } from "nodemailer";

import { config } from "./config.js";
import { AppError } from "./errors.js";

type AuthCodeEmailOptions = {
  expiresInSeconds: number;
};

type SmtpConfig = typeof config.email.smtp & {
  from: string;
  host: string;
};

let smtpTransporter: Transporter | null = null;

function getRequiredSmtpConfig(): SmtpConfig {
  const { smtp } = config.email;
  const missing: string[] = [];

  if (!smtp.host) missing.push("SMTP_HOST");
  if (!smtp.from) missing.push(config.email.provider === "qq" ? "QQ_EMAIL/SMTP_FROM" : "SMTP_FROM");
  if (config.email.provider === "qq" && (!smtp.user || !smtp.pass)) {
    missing.push("QQ_EMAIL/QQ_SMTP_AUTH_CODE");
  } else if ((smtp.user && !smtp.pass) || (!smtp.user && smtp.pass)) {
    missing.push("SMTP_USER/SMTP_PASS");
  }

  if (missing.length > 0) {
    throw new AppError(
      500,
      "EMAIL_PROVIDER_NOT_CONFIGURED",
      `SMTP 邮箱验证码服务未配置完整：${missing.join(", ")}`,
    );
  }

  return smtp as SmtpConfig;
}

function getSmtpTransporter() {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  const smtp = getRequiredSmtpConfig();
  smtpTransporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  return smtpTransporter;
}

function minutesFromSeconds(seconds: number) {
  return Math.max(1, Math.ceil(seconds / 60));
}

function buildAuthCodeEmail(code: string, options: AuthCodeEmailOptions) {
  const ttlMinutes = minutesFromSeconds(options.expiresInSeconds);
  const subject = "你的懒得出门验证码";
  const text = [
    `验证码：${code}`,
    `有效期 ${ttlMinutes} 分钟。`,
    "如果不是你本人操作，请忽略这封邮件。",
  ].join("\n");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#171432;">
      <p>你的验证码是：</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:4px;margin:12px 0;color:#7357ff;">${code}</p>
      <p>验证码有效期 ${ttlMinutes} 分钟。为了账号安全，请不要把验证码告诉别人。</p>
      <p style="color:#7b76a3;">如果不是你本人操作，请忽略这封邮件。</p>
    </div>
  `;

  return { html, subject, text };
}

export async function sendAuthCodeEmail(
  email: string,
  code: string,
  options: AuthCodeEmailOptions,
) {
  if (config.email.provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new AppError(500, "EMAIL_PROVIDER_NOT_CONFIGURED", "生产环境未配置邮箱验证码服务");
    }
    return;
  }

  const smtp = getRequiredSmtpConfig();
  const transporter = getSmtpTransporter();
  const message = buildAuthCodeEmail(code, options);

  try {
    await transporter.sendMail({
      from: smtp.fromName ? { address: smtp.from, name: smtp.fromName } : smtp.from,
      to: email,
      replyTo: smtp.replyTo || undefined,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    void error;
    smtpTransporter = null;
    throw new AppError(502, "EMAIL_SEND_FAILED", "邮箱验证码发送失败，请稍后重试", {
      provider: "smtp",
    });
  }
}
