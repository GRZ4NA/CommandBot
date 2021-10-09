import { CategoryChannel, GuildMember, NewsChannel, Role, StageChannel, StoreChannel, TextChannel, VoiceChannel } from "discord.js";
import { ObjectID, TargetID } from "../parameter.js";

export type ParameterType = "string" | "boolean" | "number" | ObjectIdType | "target";

export type ParameterResolvable = string | boolean | number | ObjectID<any> | TargetID | null;

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
