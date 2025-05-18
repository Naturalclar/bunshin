#!/usr/bin/env node

import { program } from "commander";
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import chalk from "chalk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

// Get package.json for version
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
);

// Load configuration from multiple sources in order of precedence
function loadConfig() {
  const config = {
    slackToken: null,
    defaultChannel: null,
  };

  // 1. Load from .env file
  dotenv.config();
  if (process.env.SLACK_TOKEN) {
    config.slackToken = process.env.SLACK_TOKEN;
  }
  if (process.env.DEFAULT_CHANNEL) {
    config.defaultChannel = process.env.DEFAULT_CHANNEL;
  }

  // 2. Check for .bunshinrc in current directory
  const localRcPath = "./.bunshinrc";
  if (existsSync(localRcPath)) {
    try {
      const localConfig = JSON.parse(readFileSync(localRcPath, "utf8"));
      if (localConfig.slackToken) config.slackToken = localConfig.slackToken;
      if (localConfig.defaultChannel)
        config.defaultChannel = localConfig.defaultChannel;
    } catch (error) {
      console.warn(
        chalk.yellow(
          `Warning: Invalid .bunshinrc file in current directory: ${error.message}`,
        ),
      );
    }
  }

  // 3. Check for .bunshinrc in home directory (highest priority)
  const homeRcPath = join(homedir(), ".bunshinrc");
  if (existsSync(homeRcPath)) {
    try {
      const homeConfig = JSON.parse(readFileSync(homeRcPath, "utf8"));
      if (homeConfig.slackToken) config.slackToken = homeConfig.slackToken;
      if (homeConfig.defaultChannel)
        config.defaultChannel = homeConfig.defaultChannel;
    } catch (error) {
      console.warn(
        chalk.yellow(
          `Warning: Invalid .bunshinrc file in home directory: ${error.message}`,
        ),
      );
    }
  }

  return config;
}

const config = loadConfig();

// Initialize Slack client with token from config
const slack = new WebClient(config.slackToken);

// Setup CLI
program
  .name("bunshin")
  .description("Send messages to Slack channels as yourself")
  .version(packageJson.version);

program
  .command("init")
  .description("Initialize configuration in home directory")
  .option("--token <token>", "Your Slack user token (xoxp-)")
  .option("--channel <channel>", "Default channel ID")
  .action(async (options) => {
    try {
      const configPath = join(homedir(), ".bunshinrc");

      // Start with existing config or empty object
      let currentConfig = {};
      if (existsSync(configPath)) {
        try {
          currentConfig = JSON.parse(readFileSync(configPath, "utf8"));
        } catch (error) {
          console.warn(
            chalk.yellow(
              `Warning: Invalid existing .bunshinrc file: ${error.message}`,
            ),
          );
        }
      }

      // Update with new values if provided
      if (options.token) currentConfig.slackToken = options.token;
      if (options.channel) currentConfig.defaultChannel = options.channel;

      // Write updated config
      const configContent = JSON.stringify(currentConfig, null, 2);
      writeFileSync(configPath, configContent, "utf8");

      console.log(chalk.green(`Configuration saved to ${configPath}`));

      // Check for token
      if (!currentConfig.slackToken) {
        console.log(
          chalk.yellow("No Slack token provided. You can add it later with:"),
        );
        console.log(chalk.blue(`bunshin init --token xoxp-your-token`));
        console.log(
          chalk.yellow(
            "Remember to use a User Token (xoxp-) to send messages as yourself, not a Bot Token.",
          ),
        );
      }
    } catch (error) {
      console.error(chalk.red("Error initializing config:"), error.message);
      process.exit(1);
    }
  });

program
  .command("whoami")
  .description("Verify your Slack identity for sending messages")
  .action(async () => {
    try {
      if (!config.slackToken) {
        console.error(
          chalk.red("Error: Slack token not found in configuration"),
        );
        console.log(
          chalk.yellow(
            'Please run "bunshin init --token xoxp-your-token" to set up your token',
          ),
        );
        process.exit(1);
      }

      console.log(chalk.blue("Checking your Slack identity..."));

      try {
        // Get the authenticated user's identity
        const authResult = await slack.auth.test();

        console.log(chalk.green("✓ Successfully authenticated with Slack!"));
        console.log(chalk.white("You are set up to send messages as:"));
        console.log(chalk.bold(`   Name: ${authResult.user}`));
        console.log(chalk.bold(`   User ID: ${authResult.user_id}`));
        console.log(chalk.bold(`   Team: ${authResult.team}`));

        // Check if it's a user token or bot token
        if (config.slackToken.startsWith("xoxp-")) {
          console.log(
            chalk.green(
              "✓ Using a User Token - messages will be sent as yourself",
            ),
          );
        } else {
          console.log(
            chalk.yellow(
              "⚠️ Warning: Not using a User Token (xoxp-) - messages may appear as a bot",
            ),
          );
          console.log(
            chalk.yellow(
              "   To send messages as yourself, use a User Token that starts with xoxp-",
            ),
          );
        }

        // Default channel info
        if (config.defaultChannel) {
          console.log(chalk.white(`Default channel: ${config.defaultChannel}`));
        } else {
          console.log(
            chalk.yellow(
              "No default channel configured. You will need to specify a channel with each message.",
            ),
          );
        }
      } catch (error) {
        console.error(chalk.red("Error: Failed to authenticate with Slack"));
        console.error(
          chalk.red(`Slack API Error: ${error.data?.error || error.message}`),
        );

        if (
          error.data?.error === "invalid_auth" ||
          error.data?.error === "token_expired"
        ) {
          console.log(
            chalk.yellow("Your token appears to be invalid or expired."),
          );
          console.log(chalk.yellow("Please generate a new token and run:"));
          console.log(chalk.blue("bunshin init --token xoxp-your-new-token"));
        }

        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("send")
  .description("Send a message to a Slack channel")
  .argument("<message>", "Message to send")
  .option(
    "-c, --channel <channel>",
    "Channel to send message to",
    config.defaultChannel,
  )
  .action(async (message, options) => {
    try {
      if (!config.slackToken) {
        console.error(
          chalk.red("Error: Slack token not found in configuration"),
        );
        console.log(
          chalk.yellow(
            'Please run "bunshin init --token xoxp-your-token" to set up your token',
          ),
        );
        console.log(
          chalk.yellow(
            "Or create a .bunshinrc file in your home or project directory",
          ),
        );
        console.log(
          chalk.yellow(
            "Make sure to use a User Token (xoxp-) to send messages as yourself, not a Bot Token.",
          ),
        );
        process.exit(1);
      }

      if (!options.channel) {
        console.error(chalk.red("Error: Channel not specified"));
        console.log(
          chalk.yellow(
            "Please specify a channel with --channel or set a default channel in your config",
          ),
        );
        process.exit(1);
      }

      // Process user mentions in the format @username
      async function processUserMentions(text) {
        // Find all @username patterns
        const mentionPattern = /@([a-zA-Z0-9._-]+)/g;
        const mentions = text.match(mentionPattern);

        if (!mentions) return text;

        let processedText = text;

        // Get user list to convert usernames to IDs
        try {
          const userListResponse = await slack.users.list();
          const users = userListResponse.members;

          // Replace each @username with the proper <@USER_ID> format
          for (const mention of mentions) {
            const username = mention.substring(1); // Remove the @ symbol
            let user;
            const possibleUsers = users.filter(
              (u) =>
                u.name.includes(username) ||
                u.real_name?.includes(username) ||
                u.profile.display_name?.includes(username),
            );
            console.log(
              chalk.blue(`Processing mention: ${mention} -> ${username}`),
            );

            if (possibleUsers.length === 0) {
              console.warn(
                chalk.yellow(
                  `Warning: No user found for mention "${mention}". Skipping...`,
                ),
              );
              continue;
            }
            if (possibleUsers.length > 1) {
              // priortize the exact match, otherwise take the first one
              user =
                possibleUsers.find(
                  (u) =>
                    u.name === username ||
                    u.real_name === username ||
                    u.profile.display_name === username,
                ) || possibleUsers[0];
            } else {
              user = possibleUsers[0];
            }
            if (user) {
              processedText = processedText.replace(
                new RegExp(`@${username}\\b`, "g"),
                `<@${user.id}>`,
              );
            }
          }
        } catch (error) {
          console.warn(
            chalk.yellow(
              `Warning: Couldn't process user mentions: ${error.message}`,
            ),
          );
        }

        return processedText;
      }

      console.log(
        chalk.blue(`Sending message to channel ${options.channel}...`),
      );

      // Process the message for user mentions
      const processedMessage = await processUserMentions(message);

      const result = await slack.chat.postMessage({
        channel: options.channel,
        text: processedMessage,
        as_user: true,
      });

      console.log(chalk.green("Message sent successfully!"));
      console.log(chalk.dim(`Message ID: ${result.ts}`));
    } catch (error) {
      console.error(chalk.red("Error sending message:"), error.message);
      if (error.data?.error) {
        console.error(chalk.red(`Slack API Error: ${error.data.error}`));
      }
      process.exit(1);
    }
  });

program.parse();
