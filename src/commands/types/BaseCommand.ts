import { MessageEmbed, ReplyMessageOptions, Message, CommandInteraction } from "discord.js";
import { ParameterResolvable } from "../../structures/types/Parameter.js";
import { PermissionCheckTypes, PermissionTypes } from "./permissions.js";
import { BaseCommand } from "../BaseCommand.js";
import { TargetID } from "structures/parameter.js";

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

export type CommandFunction = (argumentAccessor: ReadonlyMap<string, ParameterResolvable> | TargetID, interaction?: Message | CommandInteraction) => CommandFunctionReturnTypes;

export interface PhraseOccurrenceData {
    command: BaseCommand;
    type: "NAME" | "ALIAS";
}
