import { CommandFunction } from "./commands.js";
import { PermissionTypes } from "./CommandPermissions.js";

export interface BaseCommandInit {
    name: string;
    guilds?: string[];
    permissions?: PermissionTypes;
    announceSuccess?: boolean;
    dm?: boolean;
    function: CommandFunction;
}
