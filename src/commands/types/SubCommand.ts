import { ParameterSchema } from "../../structures/types/parameter.js";
import { CommandFunction } from "./commands.js";
import { PermissionCheckTypes, PermissionTypes } from "./CommandPermissions.js";

export interface SubCommandInit {
    name: string;
    description?: string;
    parameters?: ParameterSchema[] | "simple" | "no_input";
    usage?: string;
    permissionCheck?: PermissionCheckTypes;
    permissions?: PermissionTypes;
    announceSuccess?: boolean;
    dm?: boolean;
    function: CommandFunction;
}
