import { PermissionGuildCommandInit } from "../types/InitOptions.js";
import { CommandManager } from "../../structures/CommandManager";
import { GuildCommand } from "./GuildCommand.js";
import { PermissionCommand } from "./PermissionCommand.js";
import { CommandType } from "../types/commands.js";
import { InputManager } from "../../structures/InputManager.js";

/**
 * @class Guild-scoped executable command with permissions attached
 */
export class PermissionGuildCommand extends PermissionCommand implements GuildCommand {
    /**
     * List of Discord guild (server) IDs in which this command can be used
     * @type {Array<string>}
     */
    public readonly guilds?: string[];

    /**
     * If set to *false*, all interactions that get invoked from private/direct conversations (outside a guild) will result a PermissionError
     * @type {boolean}
     */
    public readonly dm: boolean;

    /**
     * @constructor Guild-scoped, executable, permissions command constructor
     * @param manager - command manager attached to this command
     * @param type - command type
     * @param options - command initialization options
     */
    constructor(manager: CommandManager, type: CommandType, options: PermissionGuildCommandInit) {
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

    /**
     * Invoke the command
     * @param input - input data
     */
    public async start(input: InputManager): Promise<void> {
        if (!input.interaction.guild && !this.dm) throw new Error(`Command "${this.name}" is only available inside a guild.`);
        if (this.guilds && this.guilds.length > 0 && !this.guilds.find((id) => id === input.interaction.guild?.id)) throw new Error(`Command "${this.name}" is not available.`);
        await super.start(input);
    }
}
