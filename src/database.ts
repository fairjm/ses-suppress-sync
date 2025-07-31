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

export const TASK_STATUS = {
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
};

export interface PollTask {
  id: number;
  status: string;
  start_date: Date | null;
  next_token: string | null;
}

export async function getOrCreateTaskToRun(): Promise<PollTask> {
  const pool = getPool();
  const [runningTasks] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT * FROM `poll_task` WHERE `status` = ? ORDER BY id desc LIMIT 1",
    [TASK_STATUS.RUNNING]
  );

  if (runningTasks.length > 0) {
    return runningTasks[0] as PollTask;
  }

  const [lastCompletedTasks] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT * FROM `poll_task` WHERE `status` = ? ORDER BY `id` DESC LIMIT 1",
    [TASK_STATUS.COMPLETED]
  );

  const startDate =
    lastCompletedTasks.length > 0
      ? // Start from the last completed task's created date
        new Date(lastCompletedTasks[0].created)
      : null;

  const [result] = await pool.query<mysql.ResultSetHeader>(
    "INSERT INTO `poll_task` (`status`, `start_date`) VALUES (?, ?)",
    [TASK_STATUS.RUNNING, startDate]
  );

  const [newTasks] = await pool.query<mysql.RowDataPacket[]>(
    "SELECT * FROM `poll_task` WHERE `id` = ?",
    [result.insertId]
  );

  return newTasks[0] as PollTask;
}

export async function updateTaskToken(
  id: number,
  token: string | null
): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE `poll_task` SET `next_token` = ? WHERE `id` = ?", [
    token,
    id,
  ]);
}

export async function completeTask(id: number): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE `poll_task` SET `status` = ? WHERE `id` = ?", [
    TASK_STATUS.COMPLETED,
    id,
  ]);
}

export async function failTask(id: number): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE `poll_task` SET `status` = ? WHERE `id` = ?", [
    TASK_STATUS.FAILED,
    id,
  ]);
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
