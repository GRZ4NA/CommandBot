import { Message, Interaction, CommandInteractionOption } from "discord.js";
import { ChatCommandInit, SubCommandGroupInit, SubCommandInit } from "./types/InitOptions.js";
import { DefaultParameter, InputParameter, ObjectID, Parameter } from "../structures/Parameter.js";
import { ChatCommandObject, TextCommandOptionChoiceObject, ChatCommandOptionObject, ChatCommandOptionType } from "../structures/types/api.js";
import { ChildCommandInit, ChildCommandResolvable, ChildCommands, ChildCommandType, CommandRegExps } from "./types/commands.js";
import { CommandManager } from "../structures/CommandManager.js";
import { PermissionGuildCommand } from "./base/PermissionGuildCommand.js";
import { generateUsageFromArguments } from "../utils/generateUsageFromArguments.js";
import { SubCommand } from "./SubCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { applicationState } from "../state.js";
import { InputManager } from "../structures/InputManager.js";

/**
 * A representation of CHAT_INPUT command (also known as a slash command)
 * @class
 * @extends {PermissionGuildCommand}
 */
export class ChatCommand extends PermissionGuildCommand {
    /**
     * Subcommands and groups of this command
     * @type {Array<ChildCommandResolvable>}
     * @private
     * @readonly
     */
    private readonly _children: ChildCommandResolvable[] = [];
    /**
     * List of parameters that can passed to this command
     * @type {Array<Parameter<any>>}
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
     * Command description displayed in the help message or in slash commands menu (Default description: "No description")
     * @type {string}
     * @public
     * @readonly
     */
    public readonly description: string;
    /**
     * Command usage displayed in the help message
     * @type {?string}
     * @public
     * @readonly
     */
    public readonly usage?: string;
    /**
     * Whether this command is visible in the help message (default: true)
     * @type {boolean}
     * @public
     * @readonly
     */
    public readonly visible: boolean;
    /**
     * Whether this command should be registered as a slash command (default: true)
     * @type {boolean}
     * @public
     * @readonly
     */
    public readonly slash: boolean;

    /**
     * ChatCommand constructor
     * @constructor
     * @param {CommandManager} manager - a manager that this command belongs to
     * @param {ChatCommandInit} options - {@link ChatCommandInit} object containing all options needed to create a {@link ChatCommand}
     */
    constructor(manager: CommandManager, options: ChatCommandInit) {
        super(manager, "CHAT", {
            name: options.name,
            function: options.function,
            announceSuccess: options.announceSuccess,
            guilds: options.guilds,
            permissions: options.permissions,
            dm: options.dm,
            ephemeral: options.ephemeral,
        });

        if (options.parameters == "no_input" || !options.parameters) {
            this.parameters = [];
        } else if (options.parameters == "simple") {
            this.parameters = [new DefaultParameter(this)];
        } else {
            this.parameters = options.parameters.map((ps) => new Parameter(this, ps));
        }
        this.aliases = options.aliases ? (Array.isArray(options.aliases) ? options.aliases : [options.aliases]) : undefined;
        this.description = options.description ?? "No description";
        this.usage = options.usage ?? generateUsageFromArguments(this);
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
     * Returns *true* if the command has subcommands attached
     * @type {boolean}
     */
    get hasSubCommands() {
        return this._children.length > 0;
    }
    /**
     * Returns list of attached subcommands
     * @type {Array<ChildCommandResolvable>}
     * @readonly
     */
    get children() {
        return Object.freeze([...this._children]);
    }

    /**
     * Invoke the command
     * @param {InputManager} input - input data manager
     * @returns {Promise<void>}
     * @public
     * @async
     */
    public async start(input: InputManager): Promise<void> {
        if (!this.slash && input.interaction instanceof Interaction) {
            throw new Error("This command is not available as a slash command");
        }
        await super.start(input);
    }
    /**
     * Attaches subcommand or subcommand group to this ChatCommand
     * @param {T} type - subcommand type
     * @param {ChildCommandInit<T>} options  - initialization options
     * @returns {ChildCommands<T>} A computed subcommand object
     * @public
     * @remarks After appending a subcommand or a subcommand group the main command can only be invoked using prefix interactions
     */
    public append<T extends ChildCommandType>(type: T, options: ChildCommandInit<T>): ChildCommands<T> {
        const command =
            type === "COMMAND"
                ? (new SubCommand(this, options as SubCommandInit) as ChildCommands<T>)
                : type === "GROUP"
                ? (new SubCommandGroup(this, options as SubCommandGroupInit) as ChildCommands<T>)
                : null;
        if (!command) {
            throw new Error("Incorrect command type");
        }
        if (applicationState.running) {
            console.warn(`[❌ ERROR] Cannot add command "${command.name}" while the application is running.`);
            return command;
        }
        this._children.push(command);
        return command;
    }
    /**
     *
     * @param {Array<CommandInteractionOption>} options - parameter options
     * @param {Interaction | Message} interaction - Discord interaction
     * @returns {?InputManager} an {@link InputManager} containing all interaction-related data or *null*
     * @public
     */
    public fetchSubcommand(options: CommandInteractionOption[], interaction: Interaction | Message): InputManager | null {
        if (!this.hasSubCommands) return null;
        if (options[0]) {
            if (options[0].type === "SUB_COMMAND_GROUP") {
                const grName = options[0].name;
                const group = this._children.filter((c) => c instanceof SubCommandGroup).find((c) => c.name === grName) as SubCommandGroup;
                const scOpt = options[0].options;
                if (group && scOpt) {
                    const scName = scOpt[0].name;
                    const cmd = group.children.filter((c) => c instanceof SubCommand).find((c) => c.name === scName) as SubCommand;
                    if (cmd && scOpt[0].options) {
                        return new InputManager(
                            cmd,
                            interaction,
                            cmd.parameters.map((p, index) => {
                                if (p.type === "user" || p.type === "role" || p.type === "channel" || p.type === "mentionable") {
                                    return new InputParameter(p, new ObjectID(scOpt[0].options?.[index].value?.toString() ?? "", p.type, interaction.guild ?? undefined));
                                } else {
                                    return new InputParameter(p, scOpt[0].options?.[index].value ?? null);
                                }
                            })
                        );
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else if (options[0].type === "SUB_COMMAND") {
                const cmd = this._children.filter((c) => c instanceof SubCommand).find((c) => c.name === options[0].name) as SubCommand;
                if (cmd) {
                    return new InputManager(
                        cmd,
                        interaction,
                        cmd.parameters.map((p, index) => {
                            if (p.type === "user" || p.type === "role" || p.type === "channel" || p.type === "mentionable") {
                                return new InputParameter(p, new ObjectID(options[0].options?.[index].value?.toString() ?? "", p.type, interaction.guild ?? undefined));
                            } else {
                                return new InputParameter(p, options[0].options?.[index].value ?? null);
                            }
                        })
                    );
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    /**
     *
     * @param {string} name - subcommand name
     * @param {?string} [group] - name of the group (if any)
     * @returns {?SubCommand} a {@link SubCommand} object or *null*
     */
    public getSubcommand(name: string, group?: string): SubCommand | null {
        if (!this.hasSubCommands) return null;
        if (group) {
            const gr = this._children.filter((c) => c instanceof SubCommandGroup).find((g) => g.name === group) as SubCommandGroup;
            if (gr) {
                return gr.children.find((c) => c.name === name) || null;
            } else {
                return null;
            }
        } else {
            return (this._children.filter((c) => c instanceof SubCommand).find((c) => c.name === name) as SubCommand) || null;
        }
    }
    /**
     * Converts {@link ChatCommand} instance to object that is recognized by the Discord API
     * @returns {ChatCommandObject} Discord API object
     * @public
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
            obj.options = this.hasSubCommands ? this._children.map((sc) => sc.toObject()) : options;
        }
        return obj;
    }
}
