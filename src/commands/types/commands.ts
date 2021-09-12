import { CommandInteraction, Message, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { BaseCommand } from "../BaseCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { ContextMenuCommand } from "../ContextMenuCommand.js";
import { ParameterResolvable } from "../../structures/types/parameter.js";
import { TargetID } from "../../structures/parameter.js";
import { NestedCommand } from "../NestedCommand.js";
import { SubCommand } from "../../commands/SubCommand.js";
import { ChatCommandInit } from "./ChatCommand.js";
import { NestedCommandInit } from "./NestedCommand.js";
import { ContextMenuCommandInit } from "./ContextMenuCommand.js";
import { BaseCommandInit } from "./BaseCommand.js";
import { SubCommandGroup } from "../../commands/SubCommandGroup.js";
import { SubCommandInit } from "./SubCommand.js";
import { SubCommandGroupInit } from "./SubCommandGroup.js";

export type CommandResolvable = BaseCommand | ChatCommand | ContextMenuCommand | NestedCommand | SubCommand;

export type CommandType = "CHAT" | "NESTED" | "CONTEXT";

export type ChildCommandType = "COMMAND" | "GROUP";

export type Command<T extends CommandType> = T extends "CHAT" ? ChatCommand : T extends "NESTED" ? NestedCommand : T extends "CONTEXT" ? ContextMenuCommand : BaseCommand;

export type ChildCommand<T extends ChildCommandType> = T extends "COMMAND" ? SubCommand : T extends "GROUP" ? SubCommandGroup : never;

export type CommandInit<T extends CommandType> = T extends "CHAT"
    ? ChatCommandInit
    : T extends "NESTED"
    ? NestedCommandInit
    : T extends "CONTEXT"
    ? ContextMenuCommandInit
    : BaseCommandInit;

export type ChildCommandInit<T extends ChildCommandType> = T extends "COMMAND" ? SubCommandInit : T extends "GROUP" ? SubCommandGroupInit : never;

export type CommandFunctionReturnTypes = void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;

export type CommandFunction = (args: ReadonlyMap<string, ParameterResolvable>, i: Message | CommandInteraction, t?: TargetID) => CommandFunctionReturnTypes;

export interface CommandInteractionData {
    command: BaseCommand;
    parameters: ReadonlyMap<string, ParameterResolvable>;
    target?: TargetID;
}

export const CommandRegExps = {
    baseName: /^.{1,32}$/,
    chatName: /^[\w-]{1,32}$/,
    chatDescription: /^.{1,100}$/,
    separator: /[^ ]$/,
};
