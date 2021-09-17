import { PermissionGuildCommandInit } from "../types/InitOptions.js";
import { CommandManager } from "../../structures/CommandManager";
import { GuildCommand } from "./GuildCommand.js";
import { PermissionCommand } from "./PermissionCommand.js";
import { APICommandType } from "../../structures/types/api.js";

export class PermissionGuildCommand extends PermissionCommand implements GuildCommand {
    /**
     * List of Discord guild (server) IDs in which this command can be used
     * @type {Array} *string*
     */
    public readonly guilds?: string[];

    /**
     * If set to *false*, all interactions from direct messages will result a PermissionError
     * @type {boolean}
     */
    public readonly dm: boolean;

    constructor(manager: CommandManager, type: APICommandType, options: PermissionGuildCommandInit) {
        super(manager, type, {
            name: options.name,
            announceSuccess: options.announceSuccess,
            default_permission: options.default_permission,
            permissions: options.permissions,
            function: options.function,
        });
        this.guilds = options.guilds;
        this.dm = options.dm ?? true;
    }
}
