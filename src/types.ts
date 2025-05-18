/**
 * Configuration options for Bunshin
 */
export interface BunshinConfig {
  /** Slack user token (xoxp-) with chat:write scope */
  slackToken: string | null;
  /** Default channel ID to send messages to */
  defaultChannel: string | null;
}

/**
 * Command options for the init command
 */
export interface InitOptions {
  /** Slack user token */
  token?: string;
  /** Default channel ID */
  channel?: string;
}

/**
 * Command options for the send command
 */
export interface SendOptions {
  /** Channel to send the message to */
  channel?: string;
}

/**
 * Slack user information
 */
export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile: {
    display_name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}