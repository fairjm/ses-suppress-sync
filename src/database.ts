import mysql from "mysql2/promise";
import { config } from "./config";
import { SuppressedDestinationSummary } from "@aws-sdk/client-sesv2";

let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(config.db);
  }
  return pool;
}

export async function getNextToken(): Promise<string | null> {
  const pool = getPool();
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT `value` FROM `sync_state` WHERE `key` = 'ses_next_token'"
  );
  if (rows.length > 0) {
    return rows[0].value;
  }
  return null;
}

export async function updateNextToken(token: string | null): Promise<void> {
  const pool = getPool();
  await pool.query(
    "INSERT INTO `sync_state` (`key`, `value`) VALUES ('ses_next_token', ?) ON DUPLICATE KEY UPDATE `value` = ?",
    [token, token]
  );
}

export async function syncDestinations(
  destinations: SuppressedDestinationSummary[]
): Promise<void> {
  if (destinations.length === 0) {
    return;
  }

  const pool = getPool();
  const values = destinations.map((d) => [
    d.EmailAddress,
    d.Reason,
    d.LastUpdateTime,
  ]);

  await pool.query(
    "INSERT INTO `suppressed_destinations` (`email`, `reason`, `last_updated_at`) VALUES ? ON DUPLICATE KEY UPDATE `reason` = VALUES(`reason`), `last_updated_at` = VALUES(`last_updated_at`)",
    [values]
  );
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
