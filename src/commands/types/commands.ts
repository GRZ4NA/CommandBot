import { Interaction, Message, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { ChatCommand } from "../ChatCommand.js";
import { ContextMenuCommand } from "../ContextMenuCommand.js";
import { ParameterResolvable } from "../../structures/types/parameter.js";
import { TargetID } from "../../structures/parameter.js";
import { SubCommand } from "../SubCommand.js";
import { SubCommandGroup } from "..//SubCommandGroup.js";
import { FunctionCommand } from "../base/FunctionCommand.js";
import { PermissionCommand } from "../base/PermissionCommand.js";
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

export type BaseCommandType = "BASE" | "FUNCTION" | "GUILD" | "PERMISSION" | "PERMISSIONGUILD";

export type CommandType = "CHAT" | "CONTEXT";

export type ChildCommandType = "COMMAND" | "GROUP";

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

export type Commands<T extends CommandType> = T extends "CHAT" ? ChatCommand : T extends "CONTEXT" ? ContextMenuCommand : never;

export type ChildCommands<T extends ChildCommandType> = T extends "COMMAND" ? SubCommand : T extends "GROUP" ? SubCommandGroup : never;

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

export type CommandInit<T extends CommandType> = T extends "CHAT" ? ChatCommandInit : T extends "CONTEXT" ? ContextMenuCommandInit : never;

export type ChildCommandInit<T extends ChildCommandType> = T extends "COMMAND" ? SubCommandInit : T extends "GROUP" ? SubCommandGroupInit : never;

export type BaseCommandResolvable = Command | FunctionCommand | GuildCommand | PermissionCommand | PermissionGuildCommand;

export type CommandResolvable = ChatCommand | ContextMenuCommand;

export type ChildCommandResolvable = SubCommandGroup | SubCommand;

export type ContextType = "USER" | "MESSAGE";

export type CommandFunctionReturnTypes = void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;

export type CommandFunction = (args: ReadonlyMap<string, ParameterResolvable>, interaction: Interaction | Message, target?: TargetID) => CommandFunctionReturnTypes;

export interface CommandInteractionData {
    command: FunctionCommand;
    parameters: ReadonlyMap<string, ParameterResolvable>;
    target?: TargetID;
}

export const CommandRegExps = {
    baseName: /^.{1,32}$/,
    chatName: /^[\w-]{1,32}$/,
    chatDescription: /^.{1,100}$/,
    separator: /[^ ]{1,}$/,
    prefix: /[^/ ]{1,}$/,
};
