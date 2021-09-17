import { PermissionGuildCommandInit } from "commands/types/InitOptions.js";
import { CommandManager } from "structures/CommandManager";
import { GuildCommand } from "./GuildCommand.js";
import { PermissionCommand } from "./PermissionCommand.js";

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

    constructor(manager: CommandManager, options: PermissionGuildCommandInit) {
        super(manager, {
            name: options.name,
            announceSuccess: options.announceSuccess,
            type: options.type,
            default_permission: options.default_permission,
            permissions: options.permissions,
            function: options.function,
        });
        this.guilds = options.guilds;
        this.dm = options.dm ?? true;
    }
}
