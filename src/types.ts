import {
    ClientOptions,
    ColorResolvable,
    CommandInteraction,
    ReplyMessageOptions,
} from "discord.js";
import { InputParameter, ObjectID, ParameterSchema } from "./Parameter.js";
import { PermissionResolvable, Message, MessageEmbed } from "discord.js";
import type { Command } from "./Command.js";

export interface InitOptions {
    name: string;
    prefix: string;
    argumentSeparator?: string;
    clientOptions?: ClientOptions;
    token: string;
    applicationId: string;
}
export type GetMode = "ALL" | "PREFIX" | "NO_PREFIX";
export type PermissionCheckTypes = "ALL" | "ANY";
export interface CommandBuilder {
    name: string;
    parameters?: ParameterSchema[] | "simple" | "no_input";
    aliases?: string[] | string;
    description?: string;
    usage?: string;
    permissionCheck?: PermissionCheckTypes;
    permissions?: PermissionResolvable;
    guilds?: string[];
    visible?: boolean;
    function: (
        params: (
            query: string,
            returnType?: "value" | "object"
        ) => ParameterResolvable | InputParameter | null,
        interaction?: Message | CommandInteraction
    ) =>
        | void
        | string
        | MessageEmbed
        | ReplyMessageOptions
        | Promise<void | string | MessageEmbed | ReplyMessageOptions>;
}
export interface PhraseOccurrenceData {
    command: Command;
    type: "NAME" | "ALIAS";
}
export interface CommandMessageStructure {
    command: Command;
    parameters: InputParameter[];
}
export interface HelpMessageParams {
    enabled: boolean;
    title: string;
    bottomText: string;
    color: ColorResolvable;
    description: string;
    usage: string;
}
export type ParameterType =
    | "string"
    | "boolean"
    | "number"
    | "user"
    | "role"
    | "channel"
    | "mentionable";
export type ParameterResolvable =
    | string
    | boolean
    | number
    | ObjectID
    | undefined;
export interface Choice {
    name: string;
    value: string;
}
