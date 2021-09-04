import { Permissions, Message, MessageEmbed, CommandInteraction, GuildMember, ReplyMessageOptions, PermissionResolvable } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { TextCommandInit } from "../types/TextCommand.js";
import { ParameterResolvable } from "../types/Parameter.js";
import { PermissionCheckTypes } from "../types/permissions.js";
import { OperationSuccess, PermissionsError } from "../errors.js";
import { DefaultParameter, InputParameter, Parameter } from "./Parameter.js";

/**
 * @class Class that represents a command instance
 * @exports
 */
export class TextCommand extends BaseCommand {
    /**
     * List of parameters that can passed to this command
     * @type {Array} {@link Parameter}
     */
    public readonly parameters: Parameter[];
    /**
     * List of different names that can be used to invoke a command (when using prefix interactions)
     * @type {Array} *string*
     */
    public readonly aliases?: string[];
    /**
     * Command description displayed in the help message (Default description: "No description")
     * @type {string}
     */
    public readonly description: string;
    /**
     * Command usage displayed in the help message
     * @type {string}
     */
    public readonly usage?: string;
    /**
     * Whether to check if a caller has all defined in *permissions* property permissions or at least one of them (doesn't apply to custom function permissions)
     * @type {PermissionCheckTypes} "ALL" | "ANY"
     */
    public readonly permissionCheck: PermissionCheckTypes;
    /**
     * Command permissions (if *undefined*, no permissions check will be performed)
     * @type {PermissionResolvable}
     * @type {Function} should return boolean value
     */
    public readonly permissions?: Permissions | ((m?: Message | CommandInteraction) => boolean);
    /**
     * List of Discord guild (server) IDs in which this command can be used
     * @type {Array} *string*
     */
    public readonly guilds?: string[];
    /**
     * Whether this command is visible in the help message (default: true)
     * @type {boolean}
     */
    public readonly visible: boolean;
    /**
     * Whether this command should be registered as a slash command (default: true)
     * @type {boolean}
     */
    public readonly slash: boolean;
    /**
     * Whether to send a SUCCESS message if no other response is defined (default: true)
     * @type {boolean}
     */
    public readonly announceSuccess: boolean;
    /**
     * Command execution function (triggered when someone invokes the command)
     * @type {Function}
     * @param {Function} p - function to fetch input parameters' values
     * @param {Message | CommandInteraction} i - interaction object
     * @private
     */
    private readonly function: (
        params: (query: string, returnType?: "value" | "object") => ParameterResolvable | InputParameter | null,
        interaction?: Message | CommandInteraction
    ) => void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;
    public static nameRegExp: RegExp = /^[\w-]{1,32}$/;
    public static descriptionRegExp: RegExp = /^[a-zA-Z]{1,100}$/;

    /**
     * Command constructor
     * @constructor
     * @param {TextCommandInit} o - {@link CommandBuilder}
     */
    constructor(o: TextCommandInit) {
        if (!TextCommand.nameRegExp.test(o.name)) {
            throw new Error("Incorrect command name. Text and slash commands must match this regular expression: ^[w-]{1,32}$");
        }
        if (o.description && !TextCommand.descriptionRegExp.test(o.description)) {
            throw new Error("Command descriptions must be 1-100 characters long");
        }
        super({
            name: o.name,
            type: "CHAT",
        });
        if (o.parameters == "no_input" || !o.parameters) {
            this.parameters = [];
        } else if (o.parameters == "simple") {
            this.parameters = [new DefaultParameter()];
        } else {
            this.parameters = o.parameters.map((ps) => new Parameter(ps));
        }
        this.aliases = TextCommand.processPhrase(o.aliases);
        this.description = o.description || "No description";
        this.usage = o.usage || this.generateUsageFromArguments();
        this.permissionCheck = o.permissionCheck == "ALL" || o.permissionCheck == "ANY" ? o.permissionCheck : "ANY";
        this.permissions = o.permissions ? (o.permissions instanceof Function ? o.permissions : new Permissions(o.permissions)) : undefined;
        this.guilds = o.guilds;
        this.visible = o.visible !== undefined ? o.visible : true;
        this.slash = o.slash !== undefined ? o.slash : true;
        this.announceSuccess = o.announceSuccess !== undefined ? o.announceSuccess : true;
        this.function = o.function;
    }

    /**
     * Invokes the command
     * @param {Message | CommandInteraction} [interaction] - Used to check caller's permissions. It will get passed to the execution function (specified in *function* property of command's constructor)
     * @param {InputParameter[]} [cmdParams] - list of processed parameters passed in a Discord interaction
     * @returns {Promise<void>}
     */
    public async start(interaction?: Message | CommandInteraction, cmdParams?: InputParameter[]): Promise<void> {
        const paramFindFn = function (query: string, returnType?: "value" | "object") {
            return returnType === "object" ? cmdParams?.find((p) => p.name === query) || null : cmdParams?.find((p) => p.name === query)?.value || null;
        };
        const memberPermissions: Readonly<Permissions> = (interaction?.member?.permissions as Permissions) || new Permissions();
        if (
            !this.permissions ||
            (this.permissions instanceof Function && this.permissions(interaction)) ||
            (!(this.permissions instanceof Function)
                ? this.permissionCheck == "ALL"
                    ? memberPermissions.has(this.permissions as PermissionResolvable, true)
                    : memberPermissions.any(this.permissions as PermissionResolvable, true)
                : false)
        ) {
            if (this.guilds && !this.guilds.find((g) => g == interaction?.guild?.id)) {
                throw new Error("This command is not available here");
            }
            if (!this.slash && interaction instanceof CommandInteraction) {
                throw new Error("This command is not available as a slash command");
            }
            if (interaction instanceof CommandInteraction) {
                await interaction.deferReply();
            }
            const fnResult = await this.function.call(this, paramFindFn, interaction);
            if (
                fnResult instanceof Object &&
                ("content" in (fnResult as any) ||
                    "embeds" in (fnResult as any) ||
                    "files" in (fnResult as any) ||
                    "components" in (fnResult as any) ||
                    "sticker" in (fnResult as any))
            ) {
                if (interaction instanceof Message) await interaction.reply(fnResult as ReplyMessageOptions);
                else if (interaction instanceof CommandInteraction) await interaction.editReply(fnResult as ReplyMessageOptions);
            } else if (typeof fnResult == "string") {
                if (interaction instanceof Message) await interaction?.reply({ content: fnResult });
                else if (interaction instanceof CommandInteraction)
                    await interaction.editReply({
                        content: fnResult,
                    });
            } else if (fnResult instanceof MessageEmbed) {
                if (interaction instanceof Message) await interaction?.reply({ embeds: [fnResult] });
                else if (interaction instanceof CommandInteraction) await interaction.editReply({ embeds: [fnResult] });
            } else if (this.announceSuccess && (interaction instanceof CommandInteraction ? !interaction.replied : true)) {
                throw new OperationSuccess(this);
            } else if (interaction instanceof CommandInteraction && !interaction.replied) {
                await interaction.deleteReply();
            }
        } else {
            throw new PermissionsError(this, interaction?.member as GuildMember);
        }
    }

    /**
     * Converts {@link TextCommand} instance to object that is recognized by the Discord API
     * @returns {Object} object
     */
    public toObject() {
        let options: any[] = [];
        if (this.parameters) {
            options = this.parameters.map((p) => {
                let type = 3;
                if (!/^[\w-]{1,32}$/.test(p.name)) {
                    throw new Error(`Failed to register ${p.name} parameter for ${this.name}: The option name is incorrect`);
                }
                if ((p.description || "No description").length > 100) {
                    throw new Error(`Failed to register ${p.name} parameter for ${this.name}: The description is too long`);
                }
                if (p.type == "boolean") type = 5;
                else if (p.type == "user") type = 6;
                else if (p.type == "channel") type = 7;
                else if (p.type == "role") type = 8;
                else if (p.type == "mentionable") type = 9;
                else if (p.type == "number") type = 10;
                return {
                    name: p.name,
                    description: p.description || "No description",
                    required: !p.optional,
                    type: p.choices ? 3 : type,
                    choices:
                        p.choices?.map((c) => {
                            return { name: c, value: c };
                        }) || [],
                };
            });
        }
        return {
            name: this.name,
            description: this.description,
            options: options,
        };
    }

    private static processPhrase(phrase?: string | string[]): string[] | undefined {
        if (Array.isArray(phrase)) {
            const buff = phrase.map((p) => {
                return p.split(" ").join("_");
            });
            buff.map((e, i, a) => {
                if (e == "" || e == " ") {
                    a.splice(i, 1);
                }
            });
            return buff;
        } else if (typeof phrase == "string" && phrase != "" && phrase != " ") {
            const buff = [];
            buff.push(phrase.split(" ").join("_"));
            return buff;
        } else {
            return undefined;
        }
    }

    private generateUsageFromArguments(): string {
        let usageTemplate: string = "";
        this.parameters &&
            this.parameters.map((e) => {
                usageTemplate += `[${e.name} (${e.choices ? e.choices.join(" / ") : e.type}${e.optional ? ", optional" : ""})] `;
            });
        return usageTemplate;
    }
}
