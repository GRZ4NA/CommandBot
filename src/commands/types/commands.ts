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
import { APICommandInit, ChatCommandInit, ContextMenuCommandInit, NestedCommandInit, SubCommandGroupInit, SubCommandInit } from "./InitOptions.js";

export type CommandResolvable = APICommand | FunctionCommand | PermissionCommand | ChatCommand | ContextMenuCommand | NestedCommand;

export type SubCommandResolvable = SubCommandGroup | SubCommand;

export type CommandType = "CHAT_INPUT" | "USER" | "MESSAGE";

export type ChildCommandType = "COMMAND" | "GROUP";

export type Command<T extends CommandType | "NESTED"> = T extends "CHAT_INPUT"
    ? ChatCommand
    : T extends "NESTED"
    ? NestedCommand
    : T extends "MESSAGE"
    ? ContextMenuCommand
    : T extends "USER"
    ? ContextMenuCommand
    : APICommand;

export type ChildCommand<T extends ChildCommandType> = T extends "COMMAND" ? SubCommand : T extends "GROUP" ? SubCommandGroup : never;

export type CommandInit<T extends CommandType | "NESTED"> = T extends "CHAT_INPUT"
    ? ChatCommandInit
    : T extends "NESTED"
    ? NestedCommandInit
    : T extends "MESSAGE"
    ? ContextMenuCommandInit
    : T extends "USER"
    ? ContextMenuCommandInit
    : APICommandInit;

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
