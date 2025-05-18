# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bunshin is a CLI tool for sending messages to Slack channels as yourself. It uses the Slack Web API to post messages with your user token, allowing you to script or automate sending messages to Slack channels.

## Dependencies

- commander: Command-line interface framework
- @slack/web-api: Official Slack API client
- dotenv: Environment variable management
- chalk: Terminal text styling

## Development

```bash
# Install dependencies
bun install

# Run the CLI
bun run start send "Your message" --channel C12345678

# Link globally to use from anywhere
bun link
bunshin send "Your message" --channel C12345678
```

## Configuration

The application supports multiple configuration methods:

1. `.bunshinrc` file in the user's home directory (preferred)
2. `.bunshinrc` file in the current project directory
3. `.env` file in the current directory

Configuration properties:
- `slackToken`: A user token (xoxp-) with the `chat:write` scope
- `defaultChannel`: Optional default channel ID to send messages to

## Project Structure

- `src/index.js`: Main CLI application entry point
- `.bunshinrc.example`: Example configuration file
- `.env.example`: Example environment variables file

## Notes

- The name "bunshin" (分身) means "clone" or "duplicate" in Japanese
- The tool requires a Slack user token with appropriate permissions
- Messages are sent as the authenticated user, not as a bot