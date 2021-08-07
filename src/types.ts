import {
    ClientOptions,
    ColorResolvable,
    CommandInteraction,
    Guild,
    GuildMember,
    NewsChannel,
    Role,
    TextChannel,
    VoiceChannel,
} from "discord.js";
import { ParameterSchema } from "./Parameter.js";
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
    parameters?: ParameterSchema[];
    aliases?: string[] | string;
    keywords?: string[] | string;
    description?: string;
    usage?: string;
    permissionCheck?: PermissionCheckTypes;
    permissions?: PermissionResolvable;
    guilds?: Guild[];
    visible?: boolean;
    function: (
        interaction?: Message | CommandInteraction,
        cmdParams?: ParameterResolvable[]
    ) => void | string | MessageEmbed | Promise<void | string | MessageEmbed>;
}
export interface PhraseOccurrenceData {
    command: Command;
    type: "NAME" | "ALIAS";
}
export interface CommandMessageStructure {
    command: Command;
    parameters: ParameterResolvable[];
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
export type ParameterResolvable = string | boolean | number | undefined;
export interface Choice {
    name: string;
    value: string;
}