import assert from "node:assert/strict";
import test from "node:test";

import { parseAvatarImage } from "../src/app.js";
import { AppError } from "../src/errors.js";

function expectAppError(callback: () => unknown, statusCode: number, code: string) {
  assert.throws(callback, (error) => {
    assert.equal(error instanceof AppError, true);
    assert.equal((error as AppError).statusCode, statusCode);
    assert.equal((error as AppError).code, code);
    return true;
  });
}

test("头像上传解析支持 PNG data URL", () => {
  const result = parseAvatarImage({
    imageBase64: "data:image/png;base64,iVBORw0KGgo=",
    mimeType: "image/png",
  });

  assert.equal(result.mimeType, "image/png");
  assert.equal(result.extension, "png");
  assert.equal(result.buffer.byteLength, 8);
});

test("头像上传解析按文件签名识别 JPEG", () => {
  const imageBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString("base64");
  const result = parseAvatarImage({
    imageBase64,
    mimeType: "image/png",
  });

  assert.equal(result.mimeType, "image/jpeg");
  assert.equal(result.extension, "jpg");
});

test("头像上传拒绝非图片内容", () => {
  expectAppError(
    () =>
      parseAvatarImage({
        imageBase64: Buffer.from("not an image").toString("base64"),
      }),
    400,
    "UNSUPPORTED_AVATAR_TYPE",
  );
});

test("头像上传拒绝超过 4MB 的图片", () => {
  const tooLarge = Buffer.alloc(4 * 1024 * 1024 + 1);
  tooLarge[0] = 0xff;
  tooLarge[1] = 0xd8;
  tooLarge[2] = 0xff;

  expectAppError(
    () =>
      parseAvatarImage({
        imageBase64: tooLarge.toString("base64"),
      }),
    413,
    "AVATAR_TOO_LARGE",
  );
});
