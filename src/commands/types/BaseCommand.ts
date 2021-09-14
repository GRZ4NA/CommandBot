import { CommandFunction } from "./commands.js";
import { PermissionTypes } from "./permissions.js";

export interface BaseCommandInit {
    name: string;
    guilds?: string[];
    permissions?: PermissionTypes;
    announceSuccess?: boolean;
    dm?: boolean;
    function: CommandFunction;
}
