import { ParameterSchema } from "../../structures/Parameter.js";
import { CommandPermissionsInit } from "./permissions.js";
import { CommandFunction, ContextType, EphemeralType } from "./commands.js";

/**
 * Initialization options of core {@link Command} object
 * @interface
 */
export interface APICommandInit {
    /**
     * Command name
     * @type {string}
     */
    name: string;
    /**
     * Discord API default permission
     * @type {?boolean}
     */
    default_permission?: boolean;
}
/**
 * Initialization options of base executable command
 * @interface
 * @extends {APICommandInit}
 */
export interface FunctionCommandInit extends APICommandInit {
    /**
     * Command function (will be executed when calling a command)
     * @type {?CommandFunction}
     */
    function?: CommandFunction;
    /**
     * Whether to send a built-in success message when the command has completed (if no other response is defined)
     * @type {?boolean}
     */
    announceSuccess?: boolean;
    /**
     * Whether a reply should be visible only to the caller
     *
     * - NONE - bot replies are public and visible to everyone in a text channel
     * - INTERACTIONS - bot will mark responses to Discord interactions as ephemeral and they will only be visible to the command caller
     * - FULL - INTERACTIONS + responses to prefix interactions will be sent as direct messages to the command caller
     *
     * [Read more](https://support.discord.com/hc/pl/articles/1500000580222-Ephemeral-Messages-FAQ)
     * @type {?EphemeralType}
     */
    ephemeral?: EphemeralType;
}
/**
 * Initialization options of base guild-scoped command
 * @interface
 * @extends {FunctionCommandInit}
 */
export interface GuildCommandInit extends FunctionCommandInit {
    /**
     * Whether this command should be callable using private messages with bot
     * @type {?boolean}
     */
    dm?: boolean;
    /**
     * List of Guild IDs in which the command can be called
     * @type {?Array<string>}
     */
    guilds?: string[];
}
/**
 * Initialization options of base command with attached permissions
 * @interface
 * @extends {FunctionCommandInit}
 */
export interface PermissionCommandInit extends FunctionCommandInit {
    /**
     * Object with permissions' options and resolvables
     * @type {?CommandPermissionsInit}
     */
    permissions?: CommandPermissionsInit;
}
/**
 * Initialization options of base guild-scoped command with attached permisisions
 * @interface
 * @extends {PermissionCommandInit}
 */
export interface PermissionGuildCommandInit extends PermissionCommandInit {
    /**
     * Whether this command should be callable using private messages with bot
     * @type {?boolean}
     */
    dm?: boolean;
    /**
     * List of Guild IDs in which the command can be called
     * @type {?Array<string>}
     */
    guilds?: string[];
}
/**
 * Intialization options of chat command
 * @interface
 * @extends {PermissionGuildCommandInit}
 */
export interface ChatCommandInit extends PermissionGuildCommandInit {
    /**
     * List of object defining all parameters of the command
     * @type {?ParameterSchema[] | "simple" | "no_input"}
     */
    parameters?: ParameterSchema[] | "simple" | "no_input";
    /**
     * Different string that can be used with prefix to invoke the command
     * @type {?Array<string>}
     */
    aliases?: string[] | string;
    /**
     * Command description
     * @type {?string}
     */
    description?: string;
    /**
     * Command usage (if *undefined*, the usage will be automatically generated using parameters)
     * @type {?string}
     */
    usage?: string;
    /**
     * Whether this command is visible in the help message
     * @type {?boolean}
     */
    visible?: boolean;
    /**
     * Whether this command should be registered as a slash command
     * @type {?boolean}
     */
    slash?: boolean;
}
/**
 * Initialization options of context menu interactions
 * @interface
 * @extends {PermissionGuildCommandInit}
 */
export interface ContextMenuCommandInit extends PermissionGuildCommandInit {
    /**
     * Context menu target type
     * @type {ContextType}
     */
    contextType: ContextType;
}
/**
 * Subcommand initialization options
 * @interface
 * @extends {PermissionCommandInit}
 */
export interface SubCommandInit extends PermissionCommandInit {
    /**
     * Command description
     * @type {?string}
     */
    description?: string;
    /**
     * List of object defining all parameters of the command
     * @type {?Array<ParameterSchema> | "simple" | "no_input"}
     */
    parameters?: ParameterSchema[] | "simple" | "no_input";
    /**
     * Command usage (if *undefined*, the usage will be automatically generated using parameters)
     * @type {?string}
     */
    usage?: string;
}
/**
 * Intialization options of subcommand group
 * @interface
 * @extends {APICommandInit}
 */
export interface SubCommandGroupInit extends APICommandInit {
    /**
     * Command description
     * @type {?string}
     */
    description?: string;
}
