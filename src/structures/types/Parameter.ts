import { CategoryChannel, GuildMember, Message, NewsChannel, Role, StageChannel, StoreChannel, TextChannel, VoiceChannel } from "discord.js";
import { ObjectID, TargetID } from "../parameter.js";

/**
 * Parameter type values
 * - **string** - text value
 * - **boolean** - True or False
 * - **number** - number (double) value
 * @type
 */
export type ParameterType = "string" | "boolean" | "number" | ObjectIdType;

/**
 * Input parameter value resolvable selector
 * @type
 */
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

/**
 * All parameter resolvables
 * @type
 */
export type ParameterResolvable = string | boolean | number | ObjectID<any> | TargetID<any> | null;

/**
 * Properties required to build a {@link Parameter} object
 * @interface
 */
export interface ParameterSchema {
    /**
     * Parameter name
     * @type {string}
     */
    name: string;

    /**
     * Parameter description
     * @type {?string}
     */
    description?: string;

    /**
     * Whether this parameter is optional
     * @type {boolean}
     */
    optional: boolean;

    /**
     * Type of parameter data
     * @type {ParameterType}
     */
    type: ParameterType;

    /**
     * List of value choices
     * @type {?Array<string>}
     * @remarks Available only when type is set to "string"
     */
    choices?: string[];
}

/**
 * Types of Discord objects (IDs contained in an {@link ObjectID} wrapper)
 * - **user** - server users list shown as selection menu in Discord
 * - **role** - server roles list shown as selection menu in Discord
 * - **channel** - server text, voice, stage, and category channels list shown as selection menu in Discord
 * - **mentionable** - all objects that can be mentioned list shown as selection menu in Discord
 * @type
 */
export type ObjectIdType = "user" | "role" | "channel" | "mentionable";

/**
 * *ObjectID.prototype.toObject()* return type selector
 * @type
 */
export type ObjectIdReturnType<T extends ObjectIdType> = T extends "channel"
    ? TextChannel | VoiceChannel | CategoryChannel | NewsChannel | StageChannel | StoreChannel | null
    : T extends "user"
    ? GuildMember | null
    : T extends "role"
    ? Role | null
    : T extends "mentionable"
    ? TextChannel | VoiceChannel | CategoryChannel | NewsChannel | StageChannel | StoreChannel | GuildMember | Role | null
    : never;

/**
 * Types of Discord context menu targets (IDs contained in a {@link TargetID} wrapper)
 * @type
 */
export type TargetType = "MESSAGE" | "USER";

/**
 * *TargetID.prototype.toObject()* return type selector*
 * @type
 */
export type TargetIdReturnType<T extends TargetType> = T extends "USER" ? GuildMember : T extends "MESSAGE" ? Message : never;
