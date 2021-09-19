import { Interaction, Message, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { ChatCommand } from "../ChatCommand.js";
import { ContextMenuCommand } from "../ContextMenuCommand.js";
import { ParameterResolvable } from "../../structures/types/parameter.js";
import { TargetID } from "../../structures/parameter.js";
import { NestedCommand } from "../NestedCommand.js";
import { SubCommand } from "../../commands/SubCommand.js";
import { SubCommandGroup } from "../../commands/SubCommandGroup.js";
import { APICommand } from "../base/APICommand.js";
import { FunctionCommand } from "../base/FunctionCommand.js";
import { PermissionCommand } from "../base/PermissionCommand.js";
import {
    APICommandInit,
    ChatCommandInit,
    ContextMenuCommandInit,
    FunctionCommandInit,
    GuildCommandInit,
    NestedCommandInit,
    PermissionCommandInit,
    PermissionGuildCommandInit,
    SubCommandGroupInit,
    SubCommandInit,
} from "./InitOptions.js";
import { APICommandType } from "../../structures/types/api.js";
import { GuildCommand } from "../../commands/base/GuildCommand.js";
import { PermissionGuildCommand } from "../../commands/base/PermissionGuildCommand.js";

export type CommandResolvable = APICommand | FunctionCommand | PermissionCommand | ChatCommand | ContextMenuCommand | NestedCommand;

export type SubCommandResolvable = SubCommandGroup | SubCommand;

export type BaseCommandType = "API" | "FUNCTION" | "GUILD" | "PERMISSION" | "PERMISSIONGUILD";

export type CommandType = APICommandType | "NESTED";

export type ChildCommandType = "COMMAND" | "GROUP";

export type BaseCommand<T extends BaseCommandType> = T extends "API"
    ? APICommand
    : T extends "FUNCTION"
    ? FunctionCommand
    : T extends "GUILD"
    ? GuildCommand
    : T extends "PERMISSION"
    ? PermissionCommand
    : T extends "PERMISSIONGUILD"
    ? PermissionGuildCommand
    : never;

export type Command<T extends CommandType> = T extends "CHAT_INPUT"
    ? ChatCommand
    : T extends "NESTED"
    ? NestedCommand
    : T extends "MESSAGE"
    ? ContextMenuCommand
    : T extends "USER"
    ? ContextMenuCommand
    : never;

export type ChildCommand<T extends ChildCommandType> = T extends "COMMAND" ? SubCommand : T extends "GROUP" ? SubCommandGroup : never;

export type BaseCommandInit<T extends BaseCommandType> = T extends "API"
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

export type CommandInit<T extends CommandType> = T extends "CHAT_INPUT"
    ? ChatCommandInit
    : T extends "NESTED"
    ? NestedCommandInit
    : T extends "MESSAGE"
    ? ContextMenuCommandInit
    : T extends "USER"
    ? ContextMenuCommandInit
    : never;

export type ChildCommandInit<T extends ChildCommandType> = T extends "COMMAND" ? SubCommandInit : T extends "GROUP" ? SubCommandGroupInit : never;

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
