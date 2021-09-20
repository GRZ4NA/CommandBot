import { Message, Interaction } from "discord.js";
import { ChatCommandInit } from "./types/InitOptions.js";
import { DefaultParameter, Parameter, TargetID } from "../structures/parameter.js";
import { ChatCommandObject, TextCommandOptionChoiceObject, ChatCommandOptionObject, ChatCommandOptionType } from "../structures/types/api.js";
import { ParameterResolvable } from "../structures/types/Parameter.js";
import { CommandRegExps } from "./types/commands.js";
import { CommandManager } from "../structures/CommandManager.js";
import { PermissionGuildCommand } from "./base/PermissionGuildCommand.js";
import { generateUsageFromArguments } from "../utils/generateUsageFromArguments.js";

/**
 * @class A representation of CHAT_INPUT command (also known as a slash command)
 */
export class ChatCommand extends PermissionGuildCommand {
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
     * Command description displayed in the help message or in slash commands menu (Default description: "No description")
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
     * @param {CommandManager} manager - a manager that this command belongs to
     * @param {ChatCommandInit} options - {@link ChatCommandInit} object containing all options needed to create a {@link ChatCommand}
     */
    constructor(manager: CommandManager, options: ChatCommandInit) {
        super(manager, "CHAT_INPUT", {
            name: options.name,
            function: options.function,
            announceSuccess: options.announceSuccess,
            guilds: options.guilds,
            permissions: options.permissions,
            dm: options.dm,
        });

        if (options.parameters == "no_input" || !options.parameters) {
            this.parameters = [];
        } else if (options.parameters == "simple") {
            this.parameters = [new DefaultParameter()];
        } else {
            this.parameters = options.parameters.map((ps) => new Parameter(ps));
        }
        this.aliases = options.aliases ? (Array.isArray(options.aliases) ? options.aliases : [options.aliases]) : undefined;
        this.description = options.description || "No description";
        this.usage = options.usage || generateUsageFromArguments(this);
        this.visible = options.visible !== undefined ? options.visible : true;
        this.slash = options.slash !== undefined ? options.slash : true;

        if (!CommandRegExps.chatName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid command name (regexp: ${CommandRegExps.chatName})`);
        }
        if (this.description && !CommandRegExps.chatDescription.test(this.description)) {
            throw new Error(`The description of "${this.name}" doesn't match the regular expression ${CommandRegExps.chatDescription}`);
        }
        if (this.aliases) {
            if (Array.isArray(this.aliases)) {
                this.aliases.map((a) => {
                    if (!CommandRegExps.chatName.test(a)) {
                        throw new Error(`"${a}" is not a valid alias name (regexp: ${CommandRegExps.chatName})`);
                    }
                });
            } else {
                if (!CommandRegExps.chatName.test(this.aliases)) {
                    throw new Error(`"${this.aliases}" is not a valid alias name (regexp: ${CommandRegExps.chatName})`);
                }
            }
        }
        if (this.aliases && this.aliases.length > 0 && this.aliases.find((a) => this.manager.get(a, this.type))) {
            throw new Error(`One of aliases from "${this.name}" command is already a registered name in the manager and cannot be reused.`);
        }
    }

    /**
     * Invoke the command
     * @param {ReadonlyMap<string, ParameterResolvable>} args - map of arguments from Discord message or interaction
     * @param {Message | Interaction} interaction - Discord message or an interaction object that is related to this command
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
     * @returns {ChatCommandObject} object
     */
    public toObject(): ChatCommandObject {
        const obj: ChatCommandObject = {
            ...super.toObject(),
            type: 1,
            description: this.description,
        };
        let options: ChatCommandOptionObject[] = [];
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
                    const optionObj: ChatCommandOptionObject = {
                        name: p.name,
                        description: p.description,
                        required: !p.optional,
                        type: p.choices ? 3 : (type as ChatCommandOptionType),
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
}
