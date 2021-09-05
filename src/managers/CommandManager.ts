import axios from "axios";
import { CommandInteraction, Message } from "discord.js";
import { BaseCommand } from "../structures/BaseCommand.js";
import { MissingParameterError } from "../errors.js";
import { BooleanParameter, InputParameter, NumberParameter, ObjectParameter, StringParameter } from "../structures/Parameter.js";
import { TextCommand } from "../structures/TextCommand.js";
import { CommandMessageStructure } from "../types/TextCommand.js";
import { applicationState } from "../state.js";
import { MessageCommand } from "../structures/MessageCommand.js";
import { CommandType, PhraseOccurrenceData } from "../types/BaseCommand.js";
import { UserCommand } from "../structures/UserCommand.js";
import { RegisteredCommandObject } from "../types/api.js";

/**
 * @class Command manager
 */
export class CommandManager {
    private readonly _chatCommandsList: TextCommand[] = [];
    private readonly _messagesCommandsList: BaseCommand[] = [];
    private readonly _userCommandsList: BaseCommand[] = [];

    /**
     * Prefix used as a way to trigger the bot using messages
     * @type {string}
     */
    public readonly prefix?: string;

    /**
     * Separator used to split user input to a list of {@link InputParameter}s (applies to prefix interactions)
     * @type {string}
     */
    public readonly parameterSeparator: string;

    /**
     * List of registered entities
     * @type {RegisteredCommandObject[]} Array of registered objects
     */
    public globalRegisteredCommands: RegisteredCommandObject[] = [];

    /**
     * @constructor
     * @param {string} [prefix] - prefix used as a way to trigger the bot using messages
     * @param {string} parameterSeparator - used to split user input to a list of {@link InputParameter}s (applies to prefix interactions)
     */
    constructor(prefix?: string, parameterSeparator?: string) {
        this.prefix = prefix;
        this.parameterSeparator = parameterSeparator || ",";
    }

    /**
     * Retrieves the command by name, alias or keyword
     * @param {string} phrase - command name, alias or keyword
     * @returns {TextCommand | null} Retrieved {@link Command} object from the manager or *null*
     */
    public get(phrase: string): TextCommand | null {
        let command: TextCommand | null = null;
        this._chatCommandsList.map((c) => {
            if (c.name == phrase) {
                command = c;
            }
            c.aliases &&
                c.aliases.map((a) => {
                    if (a == phrase) {
                        command = c;
                    }
                });
        });
        return command;
    }

    /**
     *
     * @param {CommandType} filter - type of commands included in the list
     * @returns {BaseCommand[]} List of commands registered in the manager
     */
    public getList(filter?: CommandType): readonly BaseCommand[] {
        switch (filter) {
            case "CHAT":
                return Object.freeze([...this._chatCommandsList]);
            case "MESSAGE":
                return Object.freeze([...this._messagesCommandsList]);
            case "USER":
                return Object.freeze([...this._userCommandsList]);
            default:
                return Object.freeze([...this._chatCommandsList, ...this._messagesCommandsList, ...this._userCommandsList]);
        }
    }

    /**
     * Adds the given {@link Command} to the instance manager with initial processing
     * @param {BaseCommand} command - {@link Command} instance object
     * @returns {boolean} Whether this command has been added successfully
     */
    public add(command: TextCommand | MessageCommand | UserCommand): void {
        try {
            if (applicationState.running) {
                throw new Error("Cannot add a command while the application is running");
            }
            if (command instanceof TextCommand) {
                const nameOccurrence: PhraseOccurrenceData | null = this.findPhraseOccurrence(command.type, command.name);
                if (nameOccurrence) {
                    throw new Error(`The name "${command.name}" has already been registered as ${nameOccurrence.type} in the "${nameOccurrence.command.name}" command.`);
                }
                command.aliases &&
                    command.aliases.map((a, i, ar) => {
                        const aliasOccurrence: PhraseOccurrenceData | null = this.findPhraseOccurrence(command.type, a);
                        if (aliasOccurrence) {
                            console.warn(
                                `[⚠ WARN] The name "${a}" is already registered as ${aliasOccurrence.type} in the "${aliasOccurrence.command.name}" command. It will be removed from the "${command.name}" command.`
                            );
                            ar.splice(i, 1);
                        }
                    });
                command.parameters &&
                    command.parameters.map((p) => {
                        if (p.type != "string" && p.choices) {
                            throw new Error('Parameter with defined choices must have a "string" type');
                        }
                    });
                this._chatCommandsList.push(command);
            } else if (command instanceof MessageCommand) {
                const nameOccurrence = this.findPhraseOccurrence(command.type, command.name);
                if (nameOccurrence) {
                    throw new Error(`The name "${command.name}" has already been registered as ${nameOccurrence.type} in the "${nameOccurrence.command.name}" command.`);
                }
                this._messagesCommandsList.push(command);
            } else if (command instanceof UserCommand) {
                const nameOccurrence = this.findPhraseOccurrence(command.type, command.name);
                if (nameOccurrence) {
                    throw new Error(`The name "${command.name}" has already been registered as ${nameOccurrence.type} in the "${nameOccurrence.command.name}" command.`);
                }
                this._userCommandsList.push(command);
            } else {
                throw new TypeError("Invalid argument type");
            }
        } catch (e) {
            console.error(`[❌ ERROR] ${e}`);
        }
    }

    /**
     * Registers commands from a manager in the Discord API
     *
     * @returns
     */
    public async register(applicationId: string, token: string) {
        const globalList = [
            ...this._chatCommandsList.filter((c) => (!Array.isArray(c.guilds) || c.guilds.length === 0) && c.slash).map((c) => c.toObject()),
            ...this._messagesCommandsList.filter((c) => !Array.isArray(c.guilds) || c.guilds.length === 0).map((c) => c.toObject()),
            ...this._userCommandsList.filter((c) => !Array.isArray(c.guilds) || c.guilds.length === 0).map((c) => c.toObject()),
        ];
        const globalRegisterRq = await axios.put(`https://discord.com/api/v8/applications/${applicationId}/commands`, globalList, { headers: { Authorization: `Bot ${token}` } });
        if (globalRegisterRq.status === 201) {
            this.globalRegisteredCommands = globalRegisterRq.data as RegisteredCommandObject[];
        }
    }

    /**
     * Fetches {@link Command} and list of {@link InputParameter}s from the given {@link Message} object
     * @param {Message} message - {@link Message} object
     * @returns {CommandMessagesStructure | null} {@link CommandMessageStructure} or *null*
     */
    public fetchFromMessage(message: Message): CommandMessageStructure | null {
        if (!this.prefix) return null;
        if (!message.author.bot && message.content.startsWith(this.prefix)) {
            const content = message.content.replace(this.prefix, "");
            const name = content.split(" ")[0];
            const command = this.get(name);
            if (command) {
                const argumentsText = content.replace(name, "");
                const paramsList = argumentsText.split(this.parameterSeparator).map((a) => {
                    return a.replace(" ", "");
                });
                if ((paramsList[0] == "" || paramsList[0] == " ") && paramsList.length == 1) {
                    paramsList.splice(0, 1);
                }
                const parameters: InputParameter[] = [];
                command.parameters.map((p, i) => {
                    if (!p.optional && !paramsList[i]) {
                        throw new MissingParameterError(p);
                    } else if (p.optional && !paramsList[i]) {
                        return;
                    }
                    switch (p.type) {
                        case "mentionable":
                        case "channel":
                        case "role":
                        case "user":
                            parameters.push(new ObjectParameter(p, paramsList[i]));
                            break;
                        case "string":
                            parameters.push(new StringParameter(p, paramsList[i]));
                            break;
                        case "boolean":
                            parameters.push(new BooleanParameter(p, paramsList[i]));
                            break;
                        case "number":
                            parameters.push(new NumberParameter(p, paramsList[i]));
                            break;
                        default:
                            parameters.push(new InputParameter(p, paramsList[i]));
                            break;
                    }
                });
                return {
                    command: command,
                    parameters: parameters,
                };
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Fetches command and parameters from the given {@link CommandInteraction} object
     * @param {CommandInteraction} interaction - {@link CommandInteraction} object
     * @returns {CommandMessagesStructure | null} {@link CommandMessageStructure} or *null*
     */
    public fetchFromInteraction(interaction: CommandInteraction): CommandMessageStructure | null {
        const cmd = this.get(interaction.commandName);
        if (cmd) {
            if (interaction.options?.data) {
                const paramsList = interaction.options.data;
                const parameters: InputParameter[] = [];
                cmd.parameters.map((p) => {
                    const inputParam = paramsList.find((d) => d.name == p.name);
                    if (!p.optional && !inputParam) {
                        throw new MissingParameterError(p);
                    } else if (p.optional && !inputParam) {
                        return;
                    }
                    switch (p.type) {
                        case "mentionable":
                        case "channel":
                        case "role":
                        case "user":
                            parameters.push(new ObjectParameter(p, inputParam?.value));
                            break;
                        case "string":
                            parameters.push(new StringParameter(p, inputParam?.value));
                            break;
                        case "boolean":
                            parameters.push(new BooleanParameter(p, inputParam?.value));
                            break;
                        case "number":
                            parameters.push(new NumberParameter(p, inputParam?.value));
                            break;
                        default:
                            parameters.push(new InputParameter(p, inputParam?.value));
                            break;
                    }
                });
                return {
                    command: cmd,
                    parameters: parameters,
                };
            }
        } else {
            return null;
        }
        return null;
    }

    private findPhraseOccurrence(type: CommandType, phrase?: string): PhraseOccurrenceData | null {
        let returnValue: PhraseOccurrenceData | null = null;
        switch (type) {
            case "CHAT":
                this._chatCommandsList.map((c) => {
                    if (phrase == c.name) {
                        returnValue = {
                            command: c,
                            type: "NAME",
                        };
                    } else if (c.aliases && c.aliases.indexOf(phrase || "") != -1) {
                        returnValue = {
                            command: c,
                            type: "ALIAS",
                        };
                    }
                });
                break;
            case "MESSAGE":
                this._messagesCommandsList.map((c) => {
                    if (phrase == c.name) {
                        returnValue = {
                            command: c,
                            type: "NAME",
                        };
                    }
                });
                break;
            case "USER":
                this._userCommandsList.map((c) => {
                    if (phrase == c.name) {
                        returnValue = {
                            command: c,
                            type: "NAME",
                        };
                    }
                });
            default:
                break;
        }
        return returnValue;
    }
}
