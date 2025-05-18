# Bunshin

A simple CLI tool to send messages to Slack channels as yourself.

## Installation

```bash
# From npm
npm install -g bunshin

# Or from source
git clone https://github.com/Naturalclar/bunshin.git
cd bunshin
bun install
bun link
```

## Configuration

You have several options for configuration:

### Option 1: Use the init command (recommended)

```bash
# Set up with the init command
bunshin init --token "xoxp-your-token-here" --channel "C12345678"
```

This creates a `.bunshinrc` file in your home directory.

### Option 2: Create a .bunshinrc file manually

Create a `.bunshinrc` file in your home directory or project directory:

```json
{
  "slackToken": "xoxp-your-token-here",
  "defaultChannel": "C12345678"
}
```

### Option 3: Use environment variables

Create a `.env` file in your project:

```
SLACK_TOKEN=xoxp-your-token-here
DEFAULT_CHANNEL=C12345678
```

## Getting a Slack Token

To send messages as yourself (not as a bot), you need a User OAuth Token:

1. Create a Slack app at https://api.slack.com/apps
2. Go to "OAuth & Permissions" in your app settings
3. Under "User Token Scopes" (not Bot Token Scopes), add:
   - `chat:write` (to send messages as yourself)
4. Install the app to your workspace
5. Copy the User OAuth Token (it starts with `xoxp-`)

> **Important**: You must use a User Token (`xoxp-`) and not a Bot Token (`xoxb-`). This CLI tool is specifically designed to send messages that appear to come directly from your Slack user, not from a bot.

## Usage

```bash
# Initialize with your token (only needed once)
bunshin init --token "xoxp-your-token-here" --channel "C12345678"

# Verify your Slack identity
bunshin whoami

# Send a message to the default channel
bunshin send "Your message here"

# Send a message to a specific channel
bunshin send -c C12345678 "Your message here"
bunshin send --channel C12345678 "Your message here"
```

## Configuration Priority

Configuration is loaded in the following order (later sources override earlier ones):
1. Environment variables
2. Project-level `.bunshinrc` file
3. Home directory `.bunshinrc` file

## License

MIT