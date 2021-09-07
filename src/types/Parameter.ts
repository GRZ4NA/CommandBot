import { ObjectID } from "../structures/Parameter.js";

export type ParameterType = "string" | "boolean" | "number" | "user" | "role" | "channel" | "mentionable" | "target";

export type ParameterResolvable = string | boolean | number | ObjectID | null;

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
