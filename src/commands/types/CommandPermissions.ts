import { PermissionResolvable, Message, Interaction } from "discord.js";

export type PermissionCheckTypes = "ALL" | "ANY";

export type PermissionFunction = (i: Interaction | Message) => boolean;

export interface CommandPermissionsInit {
    resolvable?: PermissionResolvable | PermissionFunction;
    checkType?: PermissionCheckTypes;
}
