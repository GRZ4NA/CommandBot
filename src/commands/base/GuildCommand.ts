import { Interaction, Message } from "discord.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { GuildCommandInit } from "../types/InitOptions.js";
import { APICommandType } from "../../structures/types/api.js";
import { TargetID } from "../../structures/parameter.js";
import { ParameterResolvable } from "../../structures/types/Parameter.js";

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

    constructor(manager: CommandManager, type: APICommandType, options: GuildCommandInit) {
        super(manager, type, {
            name: options.name,
            announceSuccess: options.announceSuccess,
            function: options.function,
            default_permission: options.default_permission,
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
