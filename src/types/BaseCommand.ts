import { MessageEmbed, ReplyMessageOptions, Message, CommandInteraction } from "discord.js";
import { InputParameter } from "../structures/Parameter.js";
import { ParameterResolvable } from "./Parameter.js";
import { PermissionCheckTypes, PermissionTypes } from "./permissions.js";
import { BaseCommand } from "../commands/BaseCommand.js";

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
