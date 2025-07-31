import {
  SESv2Client,
  ListSuppressedDestinationsCommand,
} from "@aws-sdk/client-sesv2";
import { config } from "./config";
import {
  syncDestinations,
  getOrCreateTaskToRun,
  updateTaskToken,
  completeTask,
  failTask,
} from "./database";

const sesClient = new SESv2Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId!,
    secretAccessKey: config.aws.secretAccessKey!,
  },
});

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSyncCycle() {
  console.log("Starting new sync cycle...");
  let task;
  try {
    task = await getOrCreateTaskToRun();
    console.log(
      `Running task ${task.id}, start_date: ${task.start_date}, next_token: ${
        task.next_token?.substring(0, 10) ?? "null"
      }...`
    );

    const command = new ListSuppressedDestinationsCommand({
      PageSize: config.sync.pageSize,
      NextToken: task.next_token ?? undefined,
      StartDate: task.start_date ?? undefined,
    });

    const response = await sesClient.send(command);
    const destinations = response.SuppressedDestinationSummaries || [];

    if (destinations.length > 0) {
      console.log(
        `Found ${destinations.length} suppressed destinations. Syncing to DB...`
      );
      await syncDestinations(destinations);
    }

    if (response.NextToken) {
      await updateTaskToken(task.id, response.NextToken);
      console.log(
        `Sync page complete. Next token updated. Sleeping for ${
          config.sync.loopInterval / 1000
        }s.`
      );
      await sleep(config.sync.loopInterval);
    } else {
      // Sync for this task is complete
      await completeTask(task.id);
      console.log(
        `Sync task ${task.id} complete. Sleeping for ${
          config.sync.emptyInterval / 1000
        }s.`
      );
      await sleep(config.sync.emptyInterval);
    }
  } catch (error) {
    console.error("An error occurred during the sync cycle:", error);
    if (task) {
      await failTask(task.id);
    }
    console.log(
      `Error occurred. Sleeping for ${
        config.sync.emptyInterval / 1000
      }s before retrying.`
    );
    await sleep(config.sync.emptyInterval);
  }
}

export async function startSync() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runSyncCycle();
  }
}
