import { CommandInteraction, Message, Permissions, ReplyMessageOptions, MessageEmbed, GuildMember } from "discord.js";
import { PermissionCheckTypes } from "../types/permissions.js";
import { CommandType, BaseCommandInit, CommandFunction } from "../types/BaseCommand.js";
import { InputParameter } from "./Parameter.js";
import { OperationSuccess, PermissionsError } from "../errors.js";
import { BaseCommandObject } from "../types/api.js";

export class BaseCommand {
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
    public readonly permissions?: Permissions | ((i: Message | CommandInteraction) => boolean);

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
    private readonly permissionChecker: (i: Message | CommandInteraction) => boolean;
    public static nameRegExp: RegExp = /^.{1,32}$/;

    /**
     * @constructor
     * @param {BaseCommandInit} o - BaseCommand initialization options
     */
    constructor(type: CommandType, o: BaseCommandInit) {
        if (!BaseCommand.nameRegExp.test(o.name)) {
            throw new Error("Incorrect command name");
        }
        this.name = o.name;
        this.type = type;
        this.guilds = o.guilds;
        this.permissionCheckMethod = o.permissionCheck !== undefined ? o.permissionCheck : "ANY";
        this.permissions = o.permissions ? (!(o.permissions instanceof Function) ? new Permissions(o.permissions) : o.permissions) : undefined;
        this.announceSuccess = o.announceSuccess !== undefined ? o.announceSuccess : true;
        this.function = o.function;
        this.permissionChecker =
            this.permissions instanceof Function
                ? this.permissions
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
                : () => true;
    }

    /**
     * Invoke the command
     * @param {Message | CommandInteraction} [interaction] - Used to check caller's permissions. It will get passed to the execution function (specified in *function* property of command's constructor)
     * @param {InputParameter[]} [cmdParams] - list of processed parameters passed in a Discord interaction
     * @returns {Promise<void>}
     */
    public async start(interaction: Message | CommandInteraction, args?: InputParameter[]): Promise<void> {
        if (this.permissionChecker(interaction)) {
            if (interaction instanceof CommandInteraction) {
                await interaction.deferReply();
            }
            await this.handleReply(interaction, await this.function.call(this, interaction, this.createAccessor(args || [])));
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
            type: this.type === "MESSAGE" ? 3 : this.type === "USER" ? 2 : 1,
            default_permissions: true,
        };
        return obj;
    }

    private createAccessor(args: InputParameter[]) {
        return function (query: string, returnType?: "value" | "object") {
            return returnType === "object" ? args.find((p) => p.name === query) || null : args.find((p) => p.name === query)?.value || null;
        };
    }

    private async handleReply(interaction: Message | CommandInteraction, result: void | string | MessageEmbed | ReplyMessageOptions) {
        if (
            result instanceof Object &&
            ("content" in (result as any) || "embeds" in (result as any) || "files" in (result as any) || "components" in (result as any) || "sticker" in (result as any))
        ) {
            if (interaction instanceof Message) await interaction.reply(result as ReplyMessageOptions);
            else if (interaction instanceof CommandInteraction) await interaction.editReply(result as ReplyMessageOptions);
        } else if (typeof result == "string") {
            if (interaction instanceof Message) await interaction?.reply({ content: result });
            else if (interaction instanceof CommandInteraction)
                await interaction.editReply({
                    content: result,
                });
        } else if (result instanceof MessageEmbed) {
            if (interaction instanceof Message) await interaction?.reply({ embeds: [result] });
            else if (interaction instanceof CommandInteraction) await interaction.editReply({ embeds: [result] });
        } else if (this.announceSuccess && (interaction instanceof CommandInteraction ? !interaction.replied : true)) {
            throw new OperationSuccess(this);
        } else if (interaction instanceof CommandInteraction && !interaction.replied) {
            await interaction.deleteReply();
        }
    }

    public static isCommand(o: any): o is BaseCommand {
        return (
            "name" in o &&
            typeof o.name === "string" &&
            BaseCommand.nameRegExp.test(o.name) &&
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
