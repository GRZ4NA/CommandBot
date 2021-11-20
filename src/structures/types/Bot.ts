import { ClientOptions } from "discord.js";

/**
 * Main object initialization options
 * @interface
 */
export interface InitOptions {
    /**
     * Bot name
     * @type {string}
     */
    name: string;

    /**
     * Prefix used as a way to trigger the bot using messages in all guilds by default
     * @remarks
     * If *undefined*, you can only interact with bot using slash commands or context menus
     * @type {?string}
     */
    globalPrefix?: string;

    /**
     * Separator used to split user input to a list of {@link InputParameter}s (applies to prefix interactions)
     * @type {?string}
     */
    argumentSeparator?: string;

    /**
     * Separator used to split subcommands when using prefix interactions
     * @type {?string}
     */
    commandSeparator?: string;

    /**
     * Additional [ClientOptions](https://discord.js.org/#/docs/main/stable/typedef/ClientOptions) for Discord.js [Client](https://discord.js.org/#/docs/main/stable/class/Client) object
     * @type {?ClientOptions}
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
