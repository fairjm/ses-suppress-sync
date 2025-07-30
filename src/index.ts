import { startSync } from "./sync";
import { closePool } from "./database";

console.log("Starting SES Suppressed Destinations Sync Service...");

startSync().catch((err) => {
  console.error("Unhandled error in sync process, shutting down...", err);
  process.exit(1);
});

async function gracefulShutdown() {
  console.log("Gracefully shutting down...");
  await closePool();
  console.log("Database pool closed.");
  process.exit(0);
}

// Handle graceful shutdown
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
