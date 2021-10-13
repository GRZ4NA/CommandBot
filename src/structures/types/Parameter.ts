import { CategoryChannel, GuildMember, Message, NewsChannel, Role, StageChannel, StoreChannel, TextChannel, VoiceChannel } from "discord.js";
import { ObjectID, TargetID } from "../parameter.js";

export type ParameterType = "string" | "boolean" | "number" | ObjectIdType;

export type InputParameterValue<T extends ParameterType> = T extends "string"
    ? string
    : T extends "boolean"
    ? boolean
    : T extends "number"
    ? number
    : T extends "user"
    ? ObjectID<"user">
    : T extends "role"
    ? ObjectID<"role">
    : T extends "channel"
    ? ObjectID<"channel">
    : T extends "mentionable"
    ? ObjectID<"mentionable">
    : never;

export type ParameterResolvable = string | boolean | number | ObjectID<any> | TargetID<any> | null;

/**
 * @interface
 * Properties required to build a {@link Parameter} object
 */
export interface ParameterSchema {
    /**
     * Parameter name
     * @type {string}
     */
    name: string;

    /**
     * Parameter description
     * @type {string}
     */
    description?: string;

    /**
     * Whether this parameter is optional
     * @type {boolean}
     */
    optional: boolean;

    type: ParameterType;

    /**
     * List of value choices (available only when type is set to "STRING")
     */
    choices?: string[];
}

export type ObjectIdType = "user" | "role" | "channel" | "mentionable";

export type ObjectIdReturnType<T extends ObjectIdType> = T extends "channel"
    ? TextChannel | VoiceChannel | CategoryChannel | NewsChannel | StageChannel | StoreChannel | null
    : T extends "user"
    ? GuildMember | null
    : T extends "role"
    ? Role | null
    : T extends "mentionable"
    ? TextChannel | VoiceChannel | CategoryChannel | NewsChannel | StageChannel | StoreChannel | GuildMember | Role | null
    : never;

export type TargetType = "MESSAGE" | "USER";

export type TargetIdReturnType<T extends TargetType> = T extends "USER" ? GuildMember : T extends "MESSAGE" ? Message : never;
