import { PermissionResolvable, Message, CommandInteraction, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { ParameterSchema, ParameterResolvable } from "./Parameter.js";
import { PermissionCheckTypes } from "./permissions.js";
import { InputParameter } from "../Parameter.js";

/**
 * @interface
 * Options for building a {@link SubCommand} object
 */
export interface SubCommandBuilder {
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
