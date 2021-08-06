import { ClientOptions, ColorResolvable } from "discord.js";
import { Parameter } from "./Parameter.js";
import { PermissionResolvable, Message, MessageEmbed } from "discord.js";
import type { Command } from "./Command.js";

export interface InitOptions {
    name: string;
    prefix: string;
    argumentSeparator?: string;
    clientOptions?: ClientOptions;
    token?: string;
}
export type GetMode = "ALL" | "PREFIX" | "NO_PREFIX";
export type PermissionCheckTypes = "ALL" | "ANY";
export interface CommandBuilder {
    name: string;
    parameters?: Parameter[];
    aliases?: string[] | string;
    keywords?: string[] | string;
    description?: string;
    usage?: string;
    permissionCheck?: PermissionCheckTypes;
    permissions?: PermissionResolvable;
    visible?: boolean;
    function: (
        message?: Message,
        cmdParams?: ParameterResolvable[]
    ) => void | string | MessageEmbed | Promise<void | string | MessageEmbed>;
}
export interface PhraseOccurrenceData {
    command: Command;
    type: "NAME" | "ALIAS";
}
export interface CommandMessageStructure {
    command: Command;
    parameters: string[];
}
export interface HelpMessageParams {
    enabled: boolean;
    title: string;
    bottomText: string;
    color: ColorResolvable;
    description: string;
    usage: string;
}
export type ParameterType = "TEXT" | "TRUE/FALSE" | "NUMBER";
export type ParameterResolvable = string | boolean | number;
