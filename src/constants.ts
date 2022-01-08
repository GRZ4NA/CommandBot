import { ClientOptions, Intents } from "discord.js";
import { SystemMessageConfiguration } from "structures/SystemMessage.js";
import { HelpMessageParams } from "./commands/Help.js";

export const IS_DEVELOPMENT_VERSION = true;
export const HELP_DEFAULT_CONFIGURATION: Required<HelpMessageParams> = {
    enabled: true,
    title: "Help",
    description: "List of all available commands",
    bottomText: "List of all available commands",
    ephemeral: "INTERACTIONS",
    color: "ORANGE",
    usage: "command name (optional)",
    visible: true,
};
export const SYSTEM_MESSAGES_DEFAULT_CONFIGURATION: Required<SystemMessageConfiguration> = {
    ERROR: {
        enabled: true,
        title: "❌ An error occurred",
        description: "Something went wrong while processing your request.",
        accentColor: "#ff0000",
        displayDetails: false,
        showTimestamp: true,
        deleteTimeout: undefined,
    },
    NOT_FOUND: {
        enabled: false,
        title: "🔍 Command not found",
        accentColor: "#ff5500",
        displayDetails: false,
        showTimestamp: true,
        deleteTimeout: undefined,
        description: undefined,
    },
    PERMISSION: {
        enabled: true,
        title: "👮‍♂️ Insufficient permissions",
        description: "You don't have enough permissions to run this command",
        accentColor: "#1d1dc4",
        displayDetails: false,
        showTimestamp: true,
        deleteTimeout: undefined,
    },
    SUCCESS: {
        enabled: true,
        title: "✅ Task completed successfully",
        accentColor: "#00ff00",
        displayDetails: false,
        showTimestamp: true,
        deleteTimeout: Infinity,
        description: undefined,
    },
    deleteTimeout: Infinity,
};
export const API_DEFAULT_INTENTS: number[] = [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
];
export const CLIENT_DEFAULT_OPTIONS: ClientOptions = {
    intents: API_DEFAULT_INTENTS,
};
