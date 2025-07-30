import dotenv from "dotenv";

dotenv.config();

export const config = {
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  },
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  },
  sync: {
    pageSize: 100,
    loopInterval: 30 * 1000, // 30 seconds to prevent too many requests
    emptyInterval: 300 * 1000, // 300 seconds if no data
  },
};

// Basic validation to ensure essential variables are set
if (
  !config.aws.accessKeyId ||
  !config.aws.secretAccessKey ||
  !config.aws.region
) {
  throw new Error("AWS credentials are not fully configured in .env file");
}

if (!config.db.host || !config.db.user || !config.db.database) {
  throw new Error("Database credentials are not fully configured in .env file");
}
