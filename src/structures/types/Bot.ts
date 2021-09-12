import { ClientOptions } from "discord.js";

/**
 * @interface
 * Main object initialization options
 */
export interface InitOptions {
    /**
     * Bot name
     * @type {string}
     */
    name: string;

    /**
     * Prefix used as a way to trigger the bot using messages
     * @type {string}
     */
    prefix?: string;

    /**
     * Separator used to split user input to a list of {@link InputParameter}s (applies to prefix interactions)
     * @type {string}
     */
    argumentSeparator?: string;

    commandSeparator?: string;

    /**
     * Additional {@link ClientOptions} for Discord.js {@link Client} object
     * @type {ClientOptions}
     */
    clientOptions?: ClientOptions;

    /**
     * Discord bot token
     * @type {string}
     */
    token: string;

    /**
     * Discord API application ID
     * @type {string}
     */
    applicationId: string;
}
