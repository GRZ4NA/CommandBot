import { CommandFunction } from "./commands.js";
import { PermissionCheckTypes, PermissionTypes } from "./permissions.js";

export interface BaseCommandInit {
    name: string;
    guilds?: string[];
    permissionCheck?: PermissionCheckTypes;
    permissions?: PermissionTypes;
    announceSuccess?: boolean;
    dm?: boolean;
    function: CommandFunction;
}
