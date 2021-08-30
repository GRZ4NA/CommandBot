import { ClientOptions, ColorResolvable, CommandInteraction, ReplyMessageOptions } from "discord.js";
import { InputParameter, ObjectID, ParameterSchema } from "./Parameter.js";
import { PermissionResolvable, Message, MessageEmbed } from "discord.js";
import type { Command } from "./Command.js";

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
    parameterSeparator?: string;
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
export type GetMode = "ALL" | "PREFIX" | "NO_PREFIX";
export type PermissionCheckTypes = "ALL" | "ANY";
/**
 * @interface
 * Options for building a {@link Command} object
 */
export interface CommandBuilder {
    /**
     * Command name
     * @type {string}
     */
    name: string;
    /**
     * List of parameters that can passed to this command
     * @type {Array | string} List of {@link Parameter}s or template ("simple" - one string input, "no_input")
     */
    parameters?: ParameterSchema[] | "simple" | "no_input";
    /**
     * List of different names that can be used to invoke a command (when using prefix interactions)
     * @type {Array} *string*
     */
    aliases?: string[] | string;
    /**
     * Command description displayed in the help message (Default description: "No description")
     * @type {string}
     */
    description?: string;
    /**
     * Command usage displayed in the help message
     * @type {string}
     */
    usage?: string;
    /**
     * Whether to check if a caller has all defined in *permissions* property permissions or at least one of them (doesn't apply to custom function permissions)
     * @type {PermissionCheckTypes} "ALL" | "ANY"
     */
    permissionCheck?: PermissionCheckTypes;
    /**
     * Command permissions (if *undefined*, no permissions check will be performed)
     * @type {PermissionResolvable}
     * @type {Function} should return boolean value
     */
    permissions?: PermissionResolvable | ((m?: Message | CommandInteraction) => boolean);
    /**
     * List of Discord guild (server) IDs in which this command can be used
     * @type {Array} *string*
     */
    guilds?: string[];
    /**
     * Whether this command is visible in the help message (default: true)
     * @type {boolean}
     */
    visible?: boolean;
    /**
     * Whether this command should be registered as a slash command (default: true)
     * @type {boolean}
     */
    slash?: boolean;
    /**
     * Whether to send a SUCCESS message if no other response is defined (default: true)
     * @type {boolean}
     */
    announceSuccess?: boolean;
    /**
     * Command execution function (triggered when someone invokes the command)
     * @type {Function}
     * @param {Function} p - function to fetch input parameters' values
     * @param {Message | CommandInteraction} i - interaction object
     */
    function: (
        params: (query: string, returnType?: "value" | "object") => ParameterResolvable | InputParameter | null,
        interaction?: Message | CommandInteraction
    ) => void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;
}
export interface PhraseOccurrenceData {
    command: Command;
    type: "NAME" | "ALIAS";
}
export interface CommandMessageStructure {
    command: Command;
    parameters: InputParameter[];
}
/**
 * @interface
 * Help message properties
 */
export interface HelpMessageParams {
    /**
     * Whether help message is enabled
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
     * @type {string}
     */
    bottomText: string;
    /**
     * Color of a message
     * @type {ColorResolvable}
     */
    color: ColorResolvable;
    /**
     * Description of the "help" command
     * @type {string}
     */
    description: string;
    /**
     * Usage of the "help" command
     * @type {string}
     */
    usage: string;
    /**
     * Whether the "help" command should be visible in the help message
     * @type {boolean}
     */
    visible: boolean;
}
export type ParameterType = "string" | "boolean" | "number" | "user" | "role" | "channel" | "mentionable";
export type ParameterResolvable = string | boolean | number | ObjectID | undefined;
