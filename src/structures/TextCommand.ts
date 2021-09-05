import { Message, CommandInteraction } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { TextCommandInit } from "../types/TextCommand.js";
import { DefaultParameter, InputParameter, Parameter } from "./Parameter.js";

/**
 * @class Class that represents a command instance
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
     * Whether this command is visible in the help message (default: true)
     * @type {boolean}
     */
    public readonly visible: boolean;

    /**
     * Whether this command should be registered as a slash command (default: true)
     * @type {boolean}
     */
    public readonly slash: boolean;

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
        super("CHAT", {
            name: o.name,
            function: o.function,
            announceSuccess: o.announceSuccess,
            guilds: o.guilds,
            permissionCheck: o.permissionCheck,
            permissions: o.permissions,
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
        this.visible = o.visible !== undefined ? o.visible : true;
        this.slash = o.slash !== undefined ? o.slash : true;
    }

    /**
     * Invokes the command
     * @param {Message | CommandInteraction} [interaction] - Used to check caller's permissions. It will get passed to the execution function (specified in *function* property of command's constructor)
     * @param {InputParameter[]} [cmdParams] - list of processed parameters passed in a Discord interaction
     * @returns {Promise<void>}
     */
    public async start(interaction: Message | CommandInteraction, cmdParams?: InputParameter[]): Promise<void> {
        if (!this.slash && interaction instanceof CommandInteraction) {
            throw new Error("This command is not available as a slash command");
        }
        super.start(interaction, cmdParams);
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
