import { Command } from "../../commands/base/Command.js";
import { ColorResolvable, GuildMember, User } from "discord.js";
import { PermissionsError } from "../../errors.js";

/**
 * Types of system messages
 * @type
 */
export type MessageType = "PERMISSION" | "ERROR" | "NOT_FOUND" | "SUCCESS";

/**
 * Configuration of a system message
 * @interface
 */
export interface SystemMessageAppearance {
    /**
     * Whether this type of message is enabled
     * @type {boolean}
     */
    enabled: boolean;

    /**
     * Title field
     * @type {string}
     */
    title: string;

    /**
     * Text below the title
     * @type {?string}
     */
    bottomText?: string;

    /**
     * Color of a message
     * @type {?ColorResolvable}
     */
    accentColor?: ColorResolvable;

    /**
     * Whether to display detailed informations in the message
     * @type {?boolean}
     */
    displayDetails?: boolean;

    /**
     * Whether to show current time and date in a footer
     * @type {?boolean}
     */
    showTimestamp?: boolean;

    /**
     * Footer text
     * @type {?string}
     */
    footer?: string;

    /**
     * Time (in ms) after a message of this type gets deleted (set to *Infinity* to not delete the message)
     * @type {?number}
     */
    deleteTimeout?: number;
}

/**
 * System message data definition
 * @interface
 */
export interface SystemMessageData {
    /**
     * A {@link Command} instance
     * @type {?Command}
     */
    command?: Command;

    /**
     * Phrase received from a Discord channel
     * @type {?string}
     */
    phrase?: string;

    /**
     * User who used the bot
     * @type {?GuildMember | User}
     */
    user?: GuildMember | User;

    /**
     * Error object
     * @type {?Error | PermissionsError | string}
     */
    error?: Error | PermissionsError | string;
}
