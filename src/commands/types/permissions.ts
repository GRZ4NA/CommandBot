import { PermissionResolvable, Message, Interaction } from "discord.js";

/**
 * Permission checking methods
 *
 * ALL - uses [*Permissions.prototype.has*](https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=has) method
 *
 * ANY - uses [*Permissions.prototype.any*](https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=any) method
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
     * @type {?PermissionResolvable | PermissionFunction}
     */
    resolvable?: PermissionResolvable | PermissionFunction;
    /**
     * Whether to check if the caller has all defined permissions or at least one of them (applies only if the command uses Discord.js permission system)
     * @type {?PermissionCheckTypes}
     */
    checkType?: PermissionCheckTypes;
}
