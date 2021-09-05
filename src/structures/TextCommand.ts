import { Message, CommandInteraction } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { TextCommandInit } from "../types/TextCommand.js";
import { DefaultParameter, InputParameter, Parameter } from "./Parameter.js";
import { TextCommandObject, TextCommandOptionChoiceObject, TextCommandOptionObject } from "../types/api.js";

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
    public static descriptionRegExp: RegExp = /^.{1,100}$/;

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
    public toObject(): TextCommandObject {
        const obj: TextCommandObject = {
            ...super.toObject(),
            description: this.description,
        };
        let options: TextCommandOptionObject[] = [];
        if (this.parameters) {
            options = this.parameters
                .map((p) => {
                    let type = 3;
                    switch (p.type) {
                        case "boolean":
                            type = 5;
                            break;
                        case "user":
                            type = 6;
                            break;
                        case "channel":
                            type = 7;
                            break;
                        case "role":
                            type = 8;
                            break;
                        case "mentionable":
                            type = 9;
                            break;
                        case "number":
                            type = 10;
                            break;
                        default:
                            type = 3;
                            break;
                    }
                    const choices: TextCommandOptionChoiceObject[] = [];
                    if (p.choices) {
                        p.choices.map((c) => {
                            choices.push({ name: c, value: c });
                        });
                    }
                    const optionObj: TextCommandOptionObject = {
                        name: p.name,
                        description: p.description,
                        required: !p.optional,
                        options: options,
                        type: p.choices ? 3 : type,
                        choices: choices.length > 0 ? choices : undefined,
                    };
                    return optionObj;
                })
                .sort((a, b) => {
                    if (a.required && !b.required) {
                        return -1;
                    } else if (a.required && b.required) {
                        return 0;
                    } else if (!a.required && b.required) {
                        return 1;
                    }
                    return 0;
                });
        }
        return obj;
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
