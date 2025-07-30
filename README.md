# SES Suppress Sync

This project is a tool to synchronize the AWS Simple Email Service (SES) suppression list with a local MySQL database. It periodically fetches the list from AWS and updates the local database, ensuring the local copy is up-to-date.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/)

## Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd ses-suppress-sync
    ```

2.  Install the dependencies:
    ```bash
    pnpm install
    ```

## Configuration

1.  Create a `.env` file by copying the example file:

    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file and fill in your AWS and database credentials:

    ```dotenv
    # AWS Credentials
    AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
    AWS_REGION=YOUR_AWS_REGION

    # Database Credentials
    DB_HOST=localhost
    DB_USER=root
    DB_PORT=3306
    DB_PASSWORD=your_password
    DB_DATABASE=your_database
    ```

## Database Setup

Connect to your MySQL database and execute the following SQL commands to create the necessary tables:

```sql
CREATE TABLE `suppressed_destinations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `reason` varchar(50) NOT NULL,
  `last_updated_at` datetime NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
);

CREATE TABLE `sync_state` (
  `key` varchar(50) NOT NULL,
  `value` text,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
);
```

_Note: A `UNIQUE KEY` on the `email` column has been added to `suppressed_destinations` to prevent duplicate entries.Remove it if you want to see all records from the same email address._

## How to Run

### Development Mode

To run the application in development mode with hot-reloading:

```bash
pnpm run dev
```

### Production Mode (with PM2)

1.  Build the TypeScript code:

    ```bash
    pnpm run build
    ```

2.  Start the application using PM2:
    ```bash
    pm2 start ecosystem.config.js
    ```

## Scripts

- `pnpm run dev`: Starts the application in development mode using `tsx`.
- `pnpm run build`: Compiles TypeScript to JavaScript.
- `pnpm run start`: Starts the compiled application from the `dist` directory.
