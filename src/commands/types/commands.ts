import { CommandInteraction, Message, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { BaseCommand } from "../BaseCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { ContextMenuCommand } from "../ContextMenuCommand.js";
import { ParameterResolvable } from "../../structures/types/parameter.js";
import { TargetID } from "../../structures/parameter.js";
import { NestedCommand } from "../NestedCommand.js";
import { SubCommand } from "commands/SubCommand.js";

export type CommandResolvable = BaseCommand | ChatCommand | ContextMenuCommand | NestedCommand | SubCommand;

export type CommandType = "CHAT" | "CONTEXT";

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
};
