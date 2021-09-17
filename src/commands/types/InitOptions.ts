import { ParameterSchema } from "../../structures/types/Parameter.js";
import { CommandPermissionsInit } from "./permissions.js";
import { CommandFunction } from "./commands.js";
import { CommandType } from "./commands.js";

export interface APICommandInit {
    name: string;
    type: CommandType;
    default_permission?: boolean;
}

export interface FunctionCommandInit extends APICommandInit {
    function: CommandFunction;
    announceSuccess?: boolean;
}

export interface GuildCommandInit extends FunctionCommandInit {
    dm?: boolean;
    guilds?: string[];
}

export interface PermissionCommandInit extends FunctionCommandInit {
    permissions?: CommandPermissionsInit;
}

export interface PermissionGuildCommandInit extends PermissionCommandInit {
    dm?: boolean;
    guilds?: string[];
}

/**
 * @interface
 * Options for building a {@link Command} object
 */
export interface ChatCommandInit extends PermissionGuildCommandInit {
    type: "CHAT_INPUT";
    parameters?: ParameterSchema[] | "simple" | "no_input";
    aliases?: string[] | string;
    description?: string;
    usage?: string;
    visible?: boolean;
    slash?: boolean;
}

export interface ContextMenuCommandInit extends PermissionGuildCommandInit {
    type: "USER" | "MESSAGE";
}

export interface NestedCommandInit extends GuildCommandInit {
    type: "CHAT_INPUT";
    description?: string;
}

export interface SubCommandInit extends PermissionCommandInit {
    type: "CHAT_INPUT";
    description?: string;
    parameters?: ParameterSchema[] | "simple" | "no_input";
    usage?: string;
}

export interface SubCommandGroupInit extends APICommandInit {
    type: "CHAT_INPUT";
    description?: string;
}
