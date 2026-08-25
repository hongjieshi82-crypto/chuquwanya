import { createApp } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

const app = createApp();

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`懒得动 API 已启动：http://localhost:${config.port}/api/v1`);
});

async function shutdown(signal: string) {
  console.log(`收到 ${signal}，正在安全关闭 API`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

