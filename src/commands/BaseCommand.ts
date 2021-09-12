import { Interaction, Message, Permissions, ReplyMessageOptions, MessageEmbed, GuildMember } from "discord.js";
import { PermissionCheckTypes } from "./types/permissions.js";
import { CommandType, CommandFunction, CommandRegExps } from "./types/commands.js";
import { BaseCommandInit } from "./types/BaseCommand.js";
import { OperationSuccess, PermissionsError } from "../errors.js";
import { BaseCommandObject } from "../structures/types/api.js";
import { ChatCommand } from "./ChatCommand.js";
import { ContextMenuCommand } from "./ContextMenuCommand.js";
import { ParameterResolvable } from "../structures/types/Parameter.js";
import { TargetID } from "../structures/parameter.js";
import { NestedCommand } from "./NestedCommand.js";
import { CommandManager } from "./CommandManager.js";

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

    /**
     * Whether to check if a caller has all defined in *permissions* property permissions or at least one of them (doesn't apply to custom function permissions)
     * @type {PermissionCheckTypes} "ALL" | "ANY"
     */
    public readonly permissionCheckMethod: PermissionCheckTypes;

    /**
     * Command permissions (if *undefined*, no permissions check will be performed)
     * @type {Permissions | Function}
     */
    public readonly permissions?: Permissions | ((i: Message | Interaction) => boolean);

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
    private readonly permissionChecker: (i: Message | Interaction) => boolean;

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
        this.permissionCheckMethod = o.permissionCheck !== undefined ? o.permissionCheck : "ANY";
        this.permissions = o.permissions ? (!(o.permissions instanceof Function) ? new Permissions(o.permissions) : o.permissions) : undefined;
        this.announceSuccess = o.announceSuccess !== undefined ? o.announceSuccess : true;
        this.function = o.function;
        this.permissionChecker =
            this.permissions instanceof Function
                ? (i) => {
                      if (Array.isArray(this.guilds) && this.guilds.length > 0 && !this.guilds.find((g) => g == i.guild?.id)) {
                          return false;
                      }
                      return (this.permissions as Function)(i);
                  }
                : this.permissions instanceof Permissions
                ? (i) => {
                      if (Array.isArray(this.guilds) && this.guilds.length > 0 && !this.guilds.find((g) => g == i.guild?.id)) {
                          return false;
                      }
                      const memberPermissions = (i.member?.permissions as Permissions) || new Permissions();
                      if (!memberPermissions) {
                          return false;
                      } else {
                          if (this.permissionCheckMethod === "ALL") {
                              return memberPermissions.has(this.permissions as Permissions, true);
                          } else {
                              return memberPermissions.any(this.permissions as Permissions, true);
                          }
                      }
                  }
                : (i) => {
                      if (Array.isArray(this.guilds) && this.guilds.length > 0 && !this.guilds.find((g) => g == i.guild?.id)) {
                          return false;
                      }
                      return true;
                  };
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
        if (this.permissionChecker(interaction)) {
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

    public isChatCommand(): this is ChatCommand {
        return "description" in this && "parameters" in this && "visible" in this && "slash" in this && (this as BaseCommand).type === "CHAT";
    }

    public isContextMenuCommand(): this is ContextMenuCommand {
        return "contextType" in this && (this as BaseCommand).type === "CONTEXT";
    }

    public isNestedCommand(): this is NestedCommand {
        return "children" in this && "append" in this && (this as BaseCommand).type === "NESTED";
    }

    public static isCommand(o: any): o is BaseCommand {
        return (
            "name" in o &&
            typeof o.name === "string" &&
            CommandRegExps.baseName.test(o.name) &&
            "type" in o &&
            (o.type === "CHAT" || o.type === "MESSAGE" || o.type === "MESSAGE") &&
            "permissionCheckMethod" in o &&
            (o.permissionCheckMethod === "ALL" || o.permissionCheckMethod === "ANY") &&
            "announceSuccess" in o &&
            typeof o.announceSuccess === "boolean" &&
            "function" in o &&
            o.function instanceof Function
        );
    }
}
