import { MessageEmbed, ReplyMessageOptions, Message, CommandInteraction } from "discord.js";
import { InputParameter } from "../structures/Parameter.js";
import { ParameterResolvable } from "./Parameter.js";
import { PermissionCheckTypes, PermissionTypes } from "./permissions.js";
import { BaseCommand } from "../structures/BaseCommand.js";
import { TextCommand } from "../structures/TextCommand.js";
import { MessageCommand } from "../structures/MessageCommand.js";
import { UserCommand } from "../structures/UserCommand.js";

export interface BaseCommandInit {
    name: string;
    guilds?: string[];
    permissionCheck?: PermissionCheckTypes;
    permissions?: PermissionTypes;
    announceSuccess?: boolean;
    function: CommandFunction;
}

export type CommandType = "CHAT" | "MESSAGE" | "USER";

export type CommandFunctionReturnTypes = void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;

export type CommandFunction = (
    interaction: Message | CommandInteraction,
    argumentAccessor?: (query: string, returnType?: "value" | "object") => ParameterResolvable | InputParameter | null
) => CommandFunctionReturnTypes;

export interface PhraseOccurrenceData {
    command: BaseCommand;
    type: "NAME" | "ALIAS";
}

export type CommandStructure<T> = T extends "MESSAGE" ? MessageCommand : T extends "USER" ? UserCommand : T extends "CHAT" ? TextCommand : never;
