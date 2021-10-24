import { PermissionResolvable, Message, Interaction } from "discord.js";

export type PermissionCheckTypes = "ALL" | "ANY";

export type PermissionFunction = (i: Interaction | Message) => boolean;

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
