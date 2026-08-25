import tencentcloud from "tencentcloud-sdk-nodejs";

import { config } from "./config.js";
import { AppError } from "./errors.js";

const SmsClient = tencentcloud.sms.v20210111.Client;

let tencentSmsClient: InstanceType<typeof SmsClient> | null = null;

function getTencentSmsClient() {
  const smsConfig = config.sms.tencent;

  if (
    !smsConfig.secretId ||
    !smsConfig.secretKey ||
    !smsConfig.smsSdkAppId ||
    !smsConfig.signName ||
    !smsConfig.templateId
  ) {
    throw new AppError(500, "SMS_PROVIDER_NOT_CONFIGURED", "短信服务未配置完整");
  }

  if (!tencentSmsClient) {
    tencentSmsClient = new SmsClient({
      credential: {
        secretId: smsConfig.secretId,
        secretKey: smsConfig.secretKey,
      },
      region: smsConfig.region,
      profile: {
        signMethod: "HmacSHA256",
        httpProfile: {
          reqMethod: "POST",
          reqTimeout: 10,
          endpoint: smsConfig.endpoint,
        },
      },
    });
  }

  return tencentSmsClient;
}

function toTencentPhoneNumber(phone: string) {
  return phone.startsWith("+") ? phone : `+86${phone}`;
}

function buildTemplateParamSet(code: string, expiresInSeconds: number) {
  const ttlMinutes = Math.ceil(expiresInSeconds / 60).toString();

  return config.sms.tencent.templateParams.map((param) => {
    switch (param) {
      case "code":
        return code;
      case "ttlMinutes":
        return ttlMinutes;
      default:
        throw new AppError(500, "SMS_TEMPLATE_PARAMS_INVALID", `不支持的短信模板变量：${param}`);
    }
  });
}

export async function sendAuthCodeSms(
  phone: string,
  code: string,
  options: { expiresInSeconds: number },
) {
  if (config.sms.provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new AppError(500, "SMS_PROVIDER_NOT_CONFIGURED", "生产环境未配置短信服务");
    }
    return;
  }

  const smsConfig = config.sms.tencent;
  const client = getTencentSmsClient();
  const response = await client.SendSms({
    PhoneNumberSet: [toTencentPhoneNumber(phone)],
    SmsSdkAppId: smsConfig.smsSdkAppId,
    SignName: smsConfig.signName,
    TemplateId: smsConfig.templateId,
    TemplateParamSet: buildTemplateParamSet(code, options.expiresInSeconds),
  });

  const sendStatus = response.SendStatusSet?.[0];
  if (!sendStatus || sendStatus.Code !== "Ok") {
    throw new AppError(502, "SMS_SEND_FAILED", sendStatus?.Message ?? "短信验证码发送失败", {
      provider: "tencent",
      providerCode: sendStatus?.Code,
      requestId: response.RequestId,
    });
  }
}
