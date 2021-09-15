import { CommandFunction } from "./commands.js";
import { CommandPermissionsInit } from "./CommandPermissions.js";

export interface BaseCommandInit {
    name: string;
    guilds?: string[];
    permissions?: CommandPermissionsInit;
    announceSuccess?: boolean;
    dm?: boolean;
    function: CommandFunction;
}
