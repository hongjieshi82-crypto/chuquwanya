import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import mysql from "mysql2/promise";

import { config } from "../src/config.js";

const connection = await mysql.createConnection({
  ...config.database,
  multipleStatements: true,
});

function isIgnorableMigrationError(error: unknown) {
  if (!(error instanceof Error) || !("code" in error)) {
    return false;
  }

  const code = String((error as { code?: string }).code);
  return code === "ER_DUP_FIELDNAME" || code === "ER_DUP_KEYNAME";
}

try {
  const schema = await readFile(resolve("../../database/schema.sql"), "utf8");
  const seed = await readFile(resolve("../../database/seed.sql"), "utf8");

  await connection.query(schema);
  await connection.query(seed);

  const migrationsDir = resolve("../../database/migrations");
  const deferredCommunityFixtures = new Set([
    "012_sample_diary_comments.sql",
    "013_sample_diary_comments_extra.sql",
  ]);
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql") && !deferredCommunityFixtures.has(file))
    .sort();

  for (const file of migrationFiles) {
    const sql = await readFile(resolve(migrationsDir, file), "utf8");
    const statements = sql
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (error) {
        if (!isIgnorableMigrationError(error)) {
          throw error;
        }
      }
    }
  }

  const [[cityCount]] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM cities",
  );
  const [[activityCount]] = await connection.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM activities",
  );

  console.log(
    `数据库迁移完成：${String(cityCount?.count ?? 0)} 个城市，` +
      `${String(activityCount?.count ?? 0)} 个玩法`,
  );
} finally {
  await connection.end();
}
