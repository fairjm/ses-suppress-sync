import {
  SESv2Client,
  ListSuppressedDestinationsCommand,
} from "@aws-sdk/client-sesv2";
import { config } from "./config";
import { getNextToken, updateNextToken, syncDestinations } from "./database";

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
  try {
    const nextToken = await getNextToken();
    console.log(
      `Found token: ${nextToken ? nextToken.substring(0, 10) + "..." : "null"}`
    );

    const command = new ListSuppressedDestinationsCommand({
      PageSize: config.sync.pageSize,
      NextToken: nextToken ?? undefined,
    });

    const response = await sesClient.send(command);
    const destinations = response.SuppressedDestinationSummaries || [];

    if (destinations.length > 0) {
      console.log(
        `Found ${destinations.length} suppressed destinations. Syncing to DB...`
      );
      await syncDestinations(destinations);
      await updateNextToken(response.NextToken || null);
      console.log(
        `Sync complete. Next token updated. Sleeping for ${
          config.sync.loopInterval / 1000
        }s.`
      );
      await sleep(config.sync.loopInterval);
    } else {
      console.log(
        `No suppressed destinations found. Resetting token and sleeping for ${
          config.sync.emptyInterval / 1000
        }s.`
      );
      await updateNextToken(null); // Reset token to start from the beginning next time
      await sleep(config.sync.emptyInterval);
    }
  } catch (error) {
    console.error("An error occurred during the sync cycle:", error);
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
