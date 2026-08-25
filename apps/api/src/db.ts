import mysql, { type PoolConnection, type RowDataPacket } from "mysql2/promise";

import { config } from "./config.js";

export const pool = mysql.createPool({
  ...config.database,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  queueLimit: 0,
  charset: "utf8mb4",
});

export async function withTransaction<T>(
  operation: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export type DbRow = RowDataPacket & Record<string, unknown>;

