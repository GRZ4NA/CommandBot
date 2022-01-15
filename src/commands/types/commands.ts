import { MessageEmbed, ReplyMessageOptions } from "discord.js";
import { ChatCommand } from "../ChatCommand";
import { ContextMenuCommand } from "../ContextMenuCommand";
import { SubCommand } from "../SubCommand";
import { SubCommandGroup } from "..//SubCommandGroup";
import { FunctionCommand } from "../base/FunctionCommand";
import { PermissionCommand } from "../base/PermissionCommand";
import {
    APICommandInit,
    ChatCommandInit,
    ContextMenuCommandInit,
    FunctionCommandInit,
    GuildCommandInit,
    PermissionCommandInit,
    PermissionGuildCommandInit,
    SubCommandGroupInit,
    SubCommandInit,
} from "./InitOptions.js";
import { GuildCommand } from "../base/GuildCommand.js";
import { PermissionGuildCommand } from "../base/PermissionGuildCommand.js";
import { Command } from "..//base/Command.js";
import { InputManager } from "../../structures/InputManager.js";

/**
 * Types of command bases
 * @type
 */
export type BaseCommandType = "BASE" | "FUNCTION" | "GUILD" | "PERMISSION" | "PERMISSIONGUILD";
/**
 * Command types
 * @type
 */
export type CommandType = "CHAT" | "CONTEXT";
/**
 * Child command types
 * @type
 */
export type ChildCommandType = "COMMAND" | "GROUP";
/**
 * Base command type selector
 * @type
 */
export type BaseCommands<T extends BaseCommandType> = T extends "BASE"
    ? Command
    : T extends "FUNCTION"
    ? FunctionCommand
    : T extends "GUILD"
    ? GuildCommand
    : T extends "PERMISSION"
    ? PermissionCommand
    : T extends "PERMISSIONGUILD"
    ? PermissionGuildCommand
    : never;
/**
 * Command type selector
 * @type
 */
export type Commands<T extends CommandType> = T extends "CHAT" ? ChatCommand : T extends "CONTEXT" ? ContextMenuCommand : never;
/**
 * Child command type selector
 * @type
 */
export type ChildCommands<T extends ChildCommandType> = T extends "COMMAND" ? SubCommand : T extends "GROUP" ? SubCommandGroup : never;
/**
 * Base command initializer selector
 * @type
 */
export type BaseCommandInit<T extends BaseCommandType> = T extends "BASE"
    ? APICommandInit
    : T extends "FUNCTION"
    ? FunctionCommandInit
    : T extends "GUILD"
    ? GuildCommandInit
    : T extends "PERMISSION"
    ? PermissionCommandInit
    : T extends "PERMISSIONGUILD"
    ? PermissionGuildCommandInit
    : never;
/**
 * Command initializer selector
 * @type
 */
export type CommandInit<T extends CommandType> = T extends "CHAT" ? ChatCommandInit : T extends "CONTEXT" ? ContextMenuCommandInit : never;
/**
 * Child command initializer selector
 * @type
 */
export type ChildCommandInit<T extends ChildCommandType> = T extends "COMMAND" ? SubCommandInit : T extends "GROUP" ? SubCommandGroupInit : never;
/**
 * Base command resolvables
 * @type
 */
export type BaseCommandResolvable = Command | FunctionCommand | GuildCommand | PermissionCommand | PermissionGuildCommand;
/**
 * Command resolvables
 * @type
 */
export type CommandResolvable = ChatCommand | ContextMenuCommand;
/**
 * Child command resolvables
 * @type
 */
export type ChildCommandResolvable = SubCommandGroup | SubCommand;
/**
 * Context menu command types
 *
 * - USER - right-click context menu interactions on users
 * - MESSAGE - right-click context menu interactions on messages
 *
 * @type
 */
export type ContextType = "USER" | "MESSAGE";
/**
 * All types that can be returned from a command function
 * @type
 */
export type CommandFunctionReturnTypes = void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;
/**
 * Command function definition
 *
 * If function returns (also after resolving a _Promise_):
 *  -   **void** - If _announceSuccess_ property is set to _true_, bot will automatically send a SUCCESS message ([details](https://grz4na.github.io/commandbot-docs/classes/SystemMessageManager.html#SUCCESS)). If command has been called using slash commands and _announceSuccess_ property is set to _false_, reply will be automatically deleted
 *  -   **string** - this string will be sent in a reply
 *  -   **[MessageEmbed](https://discord.js.org/#/docs/main/stable/class/MessageEmbed)** - embedded content will be sent in a reply
 *  -   **[ReplyMessageOptions](https://discord.js.org/#/docs/main/stable/typedef/ReplyMessageOptions)** - these options will get used to send a reply
 *
 * It is possible to manually send replies directly from the command function using the interaction property from {@link InputManager} argument. If you are using slash commands don't forget to use the _[CommandInteraction.prototype.editReply](https://discord.js.org/#/docs/main/stable/class/CommandInteraction?scrollTo=editReply)_ method instead of the _reply_ method since a **reply is already deferred** when a command function gets called (read more [here](https://discord.com/developers/docs/interactions/receiving-and-responding)) If you try to create a new reply, you app will throw an error that will result a crash.
 *
 * If you manually reply to a slash command interaction and return _void_ from the command function, a SUCCESS message will not be sent or reply will not get deleted (if you want to disable SUCCESS messages on prefix interactions set _announceSuccess_ property to _false_).
 *
 * If command function throws an error, it will automatically get caught and your bot will send an ERROR message. The app **will not** crash.
 * @type
 */
export type CommandFunction = (input: InputManager) => CommandFunctionReturnTypes;
/**
 * Ephemeral response types
 *
 * - NONE - bot replies are public and visible to everyone in a text channel
 * - INTERACTIONS - bot will mark responses to Discord interactions as ephemeral and they will only be visible to the command caller
 * - FULL - INTERACTIONS + responses to prefix interactions will be sent as direct messages to the command caller
 *
 * [Read more](https://support.discord.com/hc/pl/articles/1500000580222-Ephemeral-Messages-FAQ)
 * @type
 */
export type EphemeralType = "NONE" | "INTERACTIONS" | "FULL";

/**
 * Regular expressions used globally to perform name checking
 * @property {RegExp} baseName - base command name (used for context menu)
 * @property {RegExp} chatName - chat command name
 * @property {RegExp} chatDescription - chat command description
 * @property {RegExp} separator - argument and command separators
 * @property {RegExp} prefix - global and guild-scoped prefixes
 */
export const CommandRegExps = {
    baseName: /^.{1,32}$/,
    chatName: /^[\w-]{1,32}$/,
    chatDescription: /^.{1,100}$/,
    separator: /[^ ]{1,}$/,
    prefix: /[^/ ]{1,}$/,
};
