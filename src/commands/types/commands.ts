import { BaseCommand } from "../BaseCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { ContextMenuCommand } from "../ContextMenuCommand.js";
import { ParameterResolvable } from "structures/types/Parameter.js";
import { TargetID } from "structures/parameter.js";
import { CommandInteraction, Message, MessageEmbed, ReplyMessageOptions } from "discord.js";

export type CommandResolvable = BaseCommand | ChatCommand | ContextMenuCommand;

export type CommandType = "CHAT" | "MESSAGE" | "USER";

export type CommandFunctionReturnTypes = void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;

export type CommandFunction = (args: ReadonlyMap<string, ParameterResolvable> | TargetID, interaction?: Message | CommandInteraction) => CommandFunctionReturnTypes;

export interface CommandInteractionData {
    command: BaseCommand;
    parameters: ReadonlyMap<string, ParameterResolvable> | TargetID;
}
