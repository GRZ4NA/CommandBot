import { Interaction, Message, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { TargetID } from "../../structures/parameter.js";
import { ParameterResolvable } from "../../structures/types/Parameter.js";
import { OperationSuccess } from "../../errors.js";
import { Command } from "./Command.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { CommandFunction, CommandType } from "../types/commands.js";
import { FunctionCommandInit } from "../types/InitOptions.js";

export class FunctionCommand extends Command {
    private readonly _function: CommandFunction;
    public readonly announceSuccess: boolean;

    constructor(manager: CommandManager, type: CommandType, options: FunctionCommandInit) {
        super(manager, type, {
            name: options.name,
            default_permission: options.default_permission,
        });

        this._function = options.function;
        this.announceSuccess = options.announceSuccess ?? true;
    }

    /**
     * Invoke the command
     * @param {ReadonlyMap<string, ParameterResolvable>} args - map of arguments from Discord message or interaction
     * @param {Message | Interaction} interaction - Discord message or an interaction object that is related to this command
     * @returns {Promise<void>}
     */
    public async start(args: ReadonlyMap<string, ParameterResolvable>, interaction: Message | Interaction, target?: TargetID): Promise<void> {
        if (interaction instanceof Interaction && !interaction.isCommand() && !interaction.isContextMenu()) throw new TypeError(`Interaction not recognized`);
        if (interaction instanceof Interaction) await interaction.deferReply();
        await this.handleReply(interaction, await this._function(args, interaction, target));
    }

    private async handleReply(interaction: Message | Interaction, result: void | string | MessageEmbed | ReplyMessageOptions) {
        if (interaction instanceof Interaction && !interaction.isCommand() && !interaction.isContextMenu()) throw new TypeError(`Interaction not recognized`);
        if (
            result instanceof Object &&
            ("content" in (result as any) || "embeds" in (result as any) || "files" in (result as any) || "components" in (result as any) || "sticker" in (result as any))
        ) {
            if (interaction instanceof Message) await interaction.reply(result as ReplyMessageOptions);
            else if (interaction instanceof Interaction) await interaction.editReply(result as ReplyMessageOptions);
        } else if (typeof result == "string") {
            if (interaction instanceof Message) await interaction?.reply({ content: result });
            else if (interaction instanceof Interaction)
                await interaction.editReply({
                    content: result,
                });
        } else if (result instanceof MessageEmbed) {
            if (interaction instanceof Message) await interaction?.reply({ embeds: [result] });
            else if (interaction instanceof Interaction) await interaction.editReply({ embeds: [result] });
        } else if (this.announceSuccess && (interaction instanceof Interaction ? !interaction.replied : true)) {
            throw new OperationSuccess(this);
        } else if (interaction instanceof Interaction && !interaction.replied) {
            await interaction.deleteReply();
        }
    }
}
