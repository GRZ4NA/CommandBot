import { generateUsageFromArguments } from "../utils/generateUsageFromArguments";
import { DefaultParameter, Parameter, ParameterSchema } from "../structures/Parameter";
import { PermissionCommand, PermissionCommandInit } from "./base/PermissionCommand";
import { SubCommandGroup } from "./SubCommandGroup";
import { CommandRegExps } from "./commandsTypes";
import { ChatCommandObject, ChatCommandOptionObject, ChatCommandOptionType, TextCommandOptionChoiceObject } from "../structures/apiTypes";
import { ChatCommand } from "./ChatCommand";
import { InputManager } from "../structures/InputManager";

/**
 * Subcommand initialization options
 * @interface
 * @extends {PermissionCommandInit}
 */
export interface SubCommandInit extends PermissionCommandInit {
    /**
     * Command description
     * @type {?string}
     */
    description?: string;
    /**
     * List of object defining all parameters of the command
     * @type {?Array<ParameterSchema> | "simple" | "no_input"}
     */
    parameters?: ParameterSchema[] | "simple" | "no_input";
    /**
     * Different string that can be used with prefix to invoke the command
     * @type {?Array<string>}
     */
    aliases?: string[] | string;
    /**
     * Command usage (if *undefined*, the usage will be automatically generated using parameters)
     * @type {?string}
     */
    usage?: string;
}

/**
 * Representation of SUB_COMMAND Discord interaction
 * @class
 */
export class SubCommand extends PermissionCommand {
    /**
     * Command parent
     * @type {SubCommand | ChatCommand}
     * @public
     * @readonly
     */
    public readonly parent: SubCommandGroup | ChatCommand;
    /**
     * Command description displayed in the help message or in slash commands menu (Default description: "No description")
     * @type {string}
     * @public
     * @readonly
     */
    public readonly description: string;
    /**
     * List of parameters that can passed to this command
     * @type {Array<Parameter>}
     * @public
     * @readonly
     */
    public readonly parameters: Parameter<any>[];
    /**
     * List of different names that can be used to invoke a command (when using prefix interactions)
     * @type {?Array<string>}
     * @public
     * @readonly
     */
    public readonly aliases?: string[];
    /**
     * Command usage displayed in the help message
     * @type {?string}
     * @public
     * @readonly
     */
    public readonly usage?: string;

    /**
     * Subcommand constructor (SUB_COMMAND parameter in Discord API)
     * @constructor
     * @param {SubCommandGroup | ChatCommand} parent - command parent
     * @param {SubCommandInit} options - initialization options
     */
    constructor(parent: SubCommandGroup | ChatCommand, options: SubCommandInit) {
        super(parent instanceof SubCommandGroup ? parent.parent.manager : parent.manager, "CHAT", {
            name: options.name,
            announceSuccess: options.announceSuccess,
            permissions: options.permissions,
            function: options.function,
            ephemeral: options.ephemeral,
        });

        this.parent = parent;
        this.description = options.description ?? "No description";
        if (options.parameters == "no_input" || !options.parameters) {
            this.parameters = [];
        } else if (options.parameters == "simple") {
            this.parameters = [new DefaultParameter(this)];
        } else {
            this.parameters = options.parameters.map((ps) => new Parameter(this, ps));
        }
        this.aliases = options.aliases ? (Array.isArray(options.aliases) ? options.aliases : [options.aliases]) : undefined;
        this.usage = options.usage ?? generateUsageFromArguments(this);

        if (this.parent.children.find((ch) => ch.name === this.name)) {
            throw new Error(`Parent "${this.parent.name}" already has a subcommand or group named "${this.name}"`);
        }
        if (!CommandRegExps.chatName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid command name (regexp: ${CommandRegExps.chatName})`);
        }
        if (this.description && !CommandRegExps.chatDescription.test(this.description)) {
            throw new Error(`The description of "${this.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
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
     * @param {InputManager} input - input data
     * @returns {Promise<void>}
     * @async
     */
    public async start(input: InputManager): Promise<void> {
        if (this.parent instanceof SubCommandGroup ? !this.parent.parent.dm && !input.interaction.guild : !this.parent.dm && !input.interaction.guild)
            throw new Error(`Command "${this.name}" is only available inside a guild.`);
        if (
            this.parent instanceof SubCommandGroup
                ? this.parent.parent.guilds && this.parent.parent.guilds.length > 0 && !this.parent.parent.guilds.find((id) => id === input.interaction.guild?.id)
                : this.parent.guilds && this.parent.guilds.length > 0 && !this.parent.guilds.find((id) => id === input.interaction.guild?.id)
        )
            throw new Error(`Command "${this.name}" is not available.`);
        await super.start(input);
    }
    /**
     * @returns {ChatCommandObject} Discord API object
     * @public
     */
    public toObject(): ChatCommandObject {
        const obj: ChatCommandObject = {
            ...super.toObject(),
            type: 1 as 1,
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
