import { PermissionResolvable, Message, Interaction } from "discord.js";

/**
 * Permission checking methods
 * @type
 */
export type PermissionCheckTypes = "ALL" | "ANY";

/**
 * Definition of permission function
 * @type
 */
export type PermissionFunction = (i: Interaction | Message) => boolean;

/**
 * Command permissions initialization object
 * @interface
 */
export interface CommandPermissionsInit {
    /**
     * Resolvable (Discord.js permission resolvables) or custom function that returns *boolean* value
     * @type {PermissionResolvable | PermissionFunction}
     */
    resolvable?: PermissionResolvable | PermissionFunction;
    /**
     * Whether to check if the caller has all defined permissions or at least one of them (applies only if the command uses Discord.js permission system)
     * @type {PermissionCheckTypes}
     */
    checkType?: PermissionCheckTypes;
}
