import { Interaction, Message } from "discord.js";
import { PermissionGuildCommandInit } from "../types/InitOptions.js";
import { CommandManager } from "../../structures/CommandManager";
import { GuildCommand } from "./GuildCommand.js";
import { PermissionCommand } from "./PermissionCommand.js";
import { APICommandType } from "../../structures/types/api.js";
import { ParameterResolvable } from "../../structures/types/Parameter.js";
import { TargetID } from "../../structures/parameter.js";

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

    public async start(args: ReadonlyMap<string, ParameterResolvable>, interaction: Message | Interaction, target?: TargetID): Promise<void> {
        if (!interaction.guild && !this.dm) throw new Error(`Command "${this.name}" is only available inside a guild.`);
        if (this.guilds && this.guilds.length > 0 && !this.guilds.find((id) => id === interaction.guild?.id)) throw new Error(`Command "${this.name}" is not available.`);
        await super.start(args, interaction, target);
    }
}
