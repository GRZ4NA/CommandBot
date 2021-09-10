import { Message, Interaction } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { ChatCommandInit } from "./types/ChatCommand.js";
import { DefaultParameter, ObjectID, Parameter, TargetID } from "../structures/parameter.js";
import { TextCommandObject, TextCommandOptionChoiceObject, TextCommandOptionObject } from "../structures/types/api.js";
import { ParameterResolvable } from "../structures/types/Parameter.js";
import { MissingParameterError, ParameterTypeError } from "../errors.js";
import { CommandRegExps } from "./types/commands.js";

/**
 * @class Class that represents a command instance
 */
export class ChatCommand extends BaseCommand {
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

    /**
     * Command constructor
     * @constructor
     * @param {ChatCommandInit} o - {@link CommandBuilder}
     */
    constructor(o: ChatCommandInit) {
        if (!CommandRegExps.chatName.test(o.name)) {
            throw new Error("Incorrect command name. Text and slash commands must match this regular expression: ^[w-]{1,32}$");
        }
        if (o.description && !CommandRegExps.chatDescription.test(o.description)) {
            throw new Error("Command descriptions must be 1-100 characters long");
        }
        if (o.aliases) {
            if (Array.isArray(o.aliases)) {
                o.aliases.map((a) => {
                    if (!CommandRegExps.chatName.test(a)) {
                        throw new Error(`"${a}" is not a valid alias name`);
                    }
                });
            } else {
                if (!CommandRegExps.chatName.test(o.aliases)) {
                    throw new Error(`"${o.aliases}" is not a valid alias name`);
                }
            }
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
        this.aliases = o.aliases ? (Array.isArray(o.aliases) ? o.aliases : [o.aliases]) : undefined;
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
    public async start(args: ReadonlyMap<string, ParameterResolvable>, interaction: Message | Interaction, target?: TargetID): Promise<void> {
        if (!this.slash && interaction instanceof Interaction) {
            throw new Error("This command is not available as a slash command");
        }
        await super.start(args, interaction, target);
    }

    /**
     * Converts {@link ChatCommand} instance to object that is recognized by the Discord API
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
                        case "target":
                            throw new Error(`"target" parameter cannot be used in chat commands`);
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
            obj.options = options;
        }
        return obj;
    }

    public processArguments(args: ParameterResolvable[]): ReadonlyMap<string, ParameterResolvable> {
        if (this.parameters) {
            const mapEntries: [string, ParameterResolvable][] = this.parameters.map((p, i) => {
                if (!p.optional && !args[i]) {
                    throw new MissingParameterError(p);
                } else if (p.optional && !args[i]) {
                    return [p.name, null];
                } else if (p.type === "channel" || p.type === "mentionable" || p.type === "role" || p.type === "user") {
                    return [p.name, new ObjectID(args[i]?.toString() || "")];
                } else {
                    switch (p.type) {
                        case "boolean":
                            if (args[i] === true || args[i]?.toString().toLowerCase() === "true") {
                                return [p.name, true];
                            } else if (args[i] === false || args[i]?.toString().toLowerCase() === "false") {
                                return [p.name, false];
                            } else {
                                throw new ParameterTypeError(args[i]?.toString() || "null", p.type);
                            }
                        case "number":
                            if (isNaN(parseInt(args[i]?.toString() || "null"))) {
                                throw new ParameterTypeError(args[i]?.toString() || "null", p.type);
                            }
                            return [p.name, parseInt(args[i]?.toString() || "null")];
                        case "string":
                            if (typeof args[i] !== "string") {
                                return [p.name, args[i]?.toString() || "null"];
                            } else {
                                return [p.name, args[i] || "null"];
                            }
                        default:
                            return [p.name, args[i] || "null"];
                    }
                }
            });
            return new Map([...mapEntries]);
        } else {
            return new Map([]);
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
