import { CommandManager } from "../../structures/CommandManager.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { GuildCommandInit } from "../types/InitOptions.js";

export class GuildCommand extends FunctionCommand {
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

    constructor(manager: CommandManager, options: GuildCommandInit) {
        super(manager, {
            name: options.name,
            type: options.type,
            announceSuccess: options.announceSuccess,
            function: options.function,
            default_permission: options.default_permission,
        });
        this.guilds = options.guilds;
        this.dm = options.dm ?? true;
    }
}
