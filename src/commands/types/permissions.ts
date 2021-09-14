import { PermissionResolvable, Message, Interaction } from "discord.js";

export type PermissionCheckTypes = "ALL" | "ANY";

export type PermissionTypes = PermissionOptions | ((m?: Message | Interaction) => boolean);

export interface PermissionOptions {
    resolvables: PermissionResolvable;
    checkType?: PermissionCheckTypes;
}
