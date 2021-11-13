import { Interaction, Message, MessageEmbed, ReplyMessageOptions } from "discord.js";
import { OperationSuccess } from "../../errors.js";
import { Command } from "./Command.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { CommandFunction, CommandType } from "../types/commands.js";
import { FunctionCommandInit } from "../types/InitOptions.js";
import { InputManager } from "../../structures/InputManager.js";

/**
 * Function (executable) command
 * @class
 * @extends {Command}
 */
export class FunctionCommand extends Command {
    /**
     * Command function (called on command execution)
     * @type {CommandFunction}
     * @private
     * @readonly
     */
    private readonly _function: CommandFunction;
    /**
     * Whether a SUCCESS message should be sent after executing the command function (when there is no other reply)
     * @type {boolean}
     * @public
     * @readonly
     */
    public readonly announceSuccess: boolean;

    /**
     * Executable command constructor
     * @constructor
     * @param {CommandManager} manager - command manager attached to this command
     * @param {CommandType} type - command type
     * @param {FunctionCommandInit} options - command initailization options
     */
    constructor(manager: CommandManager, type: CommandType, options: FunctionCommandInit) {
        super(manager, type, {
            name: options.name,
            default_permission: options.default_permission,
        });

        this._function =
            options.function ??
            ((input) => {
                if (this.manager.helpCmd) return this.manager.helpCmd.generateMessage(input.interaction, this.name);
                else return;
            });
        this.announceSuccess = options.announceSuccess ?? true;
    }

    /**
     * Invoke the command
     * @param {InputManager} input - input data manager
     * @returns {Promise<void>} A *Promise* that resolves after the function command is completed
     * @public
     * @async
     */
    public async start(input: InputManager): Promise<void> {
        if (input.interaction instanceof Interaction && !input.interaction.isCommand() && !input.interaction.isContextMenu()) throw new TypeError(`Interaction not recognized`);
        if (input.interaction instanceof Interaction) await input.interaction.deferReply();
        await this.handleReply(input.interaction, await this._function(input));
    }

    /**
     * Reply handler
     * @param {Message | Interaction} interaction - Discord interaction object
     * @param {void | string | MessageEmbed | ReplyMessageOptions}  result - result of command function execution
     * @return {Promise<void>}
     * @private
     * @async
     */
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
