import { PermissionResolvable, Message, Interaction } from "discord.js";

export type PermissionCheckTypes = "ALL" | "ANY";

export type PermissionTypes = PermissionResolvable | ((m?: Message | Interaction) => boolean);
