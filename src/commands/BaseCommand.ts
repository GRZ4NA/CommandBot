import { Interaction, Message, Permissions, ReplyMessageOptions, MessageEmbed, GuildMember } from "discord.js";
import { CommandType, CommandFunction, CommandRegExps, Command } from "./types/commands.js";
import { BaseCommandInit } from "./types/BaseCommand.js";
import { OperationSuccess, PermissionsError } from "../errors.js";
import { BaseCommandObject } from "../structures/types/api.js";
import { ParameterResolvable } from "../structures/types/Parameter.js";
import { TargetID } from "../structures/parameter.js";
import { CommandManager } from "./CommandManager.js";
import { CommandPermissions } from "./CommandPermissions.js";

export class BaseCommand {
    protected readonly _manager: CommandManager;
    /**
     * Command name
     * @type {string}
     */
    public readonly name: string;

    /**
     * Application command type
     * @type {CommandType}
     */
    public readonly type: CommandType;

    /**
     * List of Discord guild (server) IDs in which this command can be used
     * @type {Array} *string*
     */
    public readonly guilds?: string[];

    public readonly dm: boolean;

    /**
     * Command permissions (if *undefined*, no permissions check will be performed)
     * @type {Permissions | Function}
     */
    public readonly permissions: CommandPermissions;

    /**
     * Whether to send a SUCCESS message if no other response is defined (default: true)
     * @type {boolean}
     */
    public readonly announceSuccess: boolean;

    /**
     * Command execution function (triggered when someone invokes the command)
     * @type {Function}
     * @private
     */
    private readonly function: CommandFunction;

    /**
     * @constructor
     * @param {BaseCommandInit} o - BaseCommand initialization options
     */
    constructor(manager: CommandManager, type: CommandType, o: BaseCommandInit) {
        if (!CommandRegExps.baseName.test(o.name)) {
            throw new Error(`"${o.name}" is not a valid command name (regexp: ${CommandRegExps.baseName})`);
        }
        this._manager = manager;
        this.name = o.name;
        this.type = type;
        this.guilds = o.guilds;
        this.dm = o.dm ?? true;
        this.permissions = new CommandPermissions(this, o.permissions);
        this.announceSuccess = o.announceSuccess ?? true;
        this.function = o.function;
    }

    get manager() {
        return this._manager;
    }

    /**
     * Invoke the command
     * @param {Message | Interaction} [interaction] - Used to check caller's permissions. It will get passed to the execution function (specified in *function* property of command's constructor)
     * @param {InputParameter[]} [cmdParams] - list of processed parameters passed in a Discord interaction
     * @returns {Promise<void>}
     */
    public async start(args: ReadonlyMap<string, ParameterResolvable>, interaction: Message | Interaction, target?: TargetID): Promise<void> {
        if (interaction instanceof Interaction && !interaction.isCommand() && !interaction.isContextMenu()) throw new TypeError(`Interaction not recognized`);
        if (this.permissions.check(interaction)) {
            if (interaction instanceof Interaction) {
                await interaction.deferReply();
            }
            await this.handleReply(interaction, await this.function(args, interaction, target));
        } else {
            throw new PermissionsError(this, interaction.member as GuildMember);
        }
    }

    /**
     * Converts a command object to Discord API type object
     * @return {Object} An object that is accepted by the Discord API
     */
    public toObject(): BaseCommandObject {
        const obj: BaseCommandObject = {
            name: this.name,
            type: this.type === "CONTEXT" ? 0 : 1,
            default_permissions: true,
        };
        return obj;
    }

    public isCommandType<T extends CommandType>(type: T): this is Command<T> {
        switch (type) {
            case "CHAT":
                return "description" in this && "parameters" in this && "visible" in this && "slash" in this && (this as BaseCommand).type === "CHAT";
            case "CONTEXT":
                return "contextType" in this && (this as BaseCommand).type === "CONTEXT";
            case "NESTED":
                return "children" in this && "append" in this && (this as BaseCommand).type === "NESTED";
            default:
                return false;
        }
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
