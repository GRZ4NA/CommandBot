import { PermissionResolvable, Message, CommandInteraction } from "discord.js";

export type PermissionCheckTypes = "ALL" | "ANY";

export type PermissionTypes = PermissionResolvable | ((m?: Message | CommandInteraction) => boolean);
