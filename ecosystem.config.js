// export const apps = [
//   {
//     name: "ses-suppress-sync",
//     script: "dist/index.js", // Run the compiled file
//     watch: false,
//     autorestart: true,
//     max_memory_restart: "1G",
//     env: {
//       NODE_ENV: "production",
//     },
//   },
// ];
module.exports = {
  apps: [
    {
      name: "ses-suppress-sync",
      script: "dist/index.js", // Run the compiled file
      watch: false,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
