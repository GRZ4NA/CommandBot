import { CommandInteraction, Message } from "discord.js";
import { MissingParameterError } from "./errors.js";
import {
    BooleanParameter,
    InputParameter,
    NumberParameter,
    ObjectParameter,
    StringParameter,
} from "./Parameter.js";
import { Command } from "./Command.js";
import {
    CommandMessageStructure,
    GetMode,
    PhraseOccurrenceData,
} from "./types.js";

export class CommandManager {
    list: Command[];
    prefix: string;
    argumentSeparator: string;

    constructor(prefix: string, argumentSeparator?: string) {
        this.list = [];
        this.prefix = prefix;
        this.argumentSeparator = argumentSeparator || ",";
    }

    /**
     * Retrieves the command by name, alias or keyword
     * @param {string} phrase - command name, alias or keyword
     * @param {GetMode} [mode='ALL'] - specifies which types of command triggers will be used to find the command [*NO_PREFIX* - only keywords; *PREFIX* - names and aliases]
     * @returns *Command* | *null*
     */
    get(phrase: string): Command | null {
        let command: Command | null = null;
        this.list.map((c) => {
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
     * Adds the given command to the instance manager
     * @param {Command} command - *Command* or *HelpMessage* object
     * @returns *boolean*
     */
    add(command: Command): boolean {
        try {
            if (!(command instanceof Command)) {
                throw new TypeError("Inavlid argument type");
            }
            const nameOccurrence: PhraseOccurrenceData | null =
                this.findPhraseOccurrence(command.name);
            if (nameOccurrence) {
                throw new Error(
                    `The name "${command.name}" has already been registered as ${nameOccurrence.type} in the "${nameOccurrence.command.name}" command.`
                );
            }
            command.aliases &&
                command.aliases.map((a, i, ar) => {
                    const aliasOccurrence: PhraseOccurrenceData | null =
                        this.findPhraseOccurrence(a);
                    if (aliasOccurrence) {
                        console.warn(
                            `[⚠ WARN] The name "${a}" is already registered as ${aliasOccurrence.type} in the "${aliasOccurrence.command.name}" command. It will be removed from the "${command.name}" command.`
                        );
                        ar.splice(i, 1);
                    }
                });
            this.list.push(command);
            return true;
        } catch (e) {
            console.error(`[❌ ERROR] ${e.toString()}`);
            return false;
        }
    }

    /**
     * Fetches command and parameters from the given *Message* object
     * @param {Message} message - *Message* object
     * @returns *CommandMessagesStructure* | *null*
     */
    fetchFromMessage(message: Message): CommandMessageStructure | null {
        if (!message.author.bot && message.content.startsWith(this.prefix)) {
            const content = message.content.replace(this.prefix, "");
            const name = content.split(" ")[0];
            const command = this.get(name);
            if (command) {
                const argumentsText = content.replace(name, "");
                const paramsList = argumentsText
                    .split(this.argumentSeparator)
                    .map((a) => {
                        return a.replace(" ", "");
                    });
                if (
                    (paramsList[0] == "" || paramsList[0] == " ") &&
                    paramsList.length == 1
                ) {
                    paramsList.splice(0, 1);
                }
                const parameters: InputParameter[] = [];
                command.parameters.map((p, i) => {
                    if (!p.optional && !paramsList[i]) {
                        throw new MissingParameterError(p);
                    }
                    switch (p.type) {
                        case "mentionable":
                        case "channel":
                        case "role":
                        case "user":
                            parameters.push(
                                new ObjectParameter(p, paramsList[i])
                            );
                            break;
                        case "string":
                            parameters.push(
                                new StringParameter(p, paramsList[i])
                            );
                            break;
                        case "boolean":
                            parameters.push(
                                new BooleanParameter(p, paramsList[i])
                            );
                            break;
                        case "number":
                            parameters.push(
                                new NumberParameter(p, paramsList[i])
                            );
                            break;
                        default:
                            parameters.push(
                                new InputParameter(p, paramsList[i])
                            );
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

    fetchFromInteraction(
        interaction: CommandInteraction
    ): CommandMessageStructure | null {
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
                            parameters.push(
                                new ObjectParameter(p, inputParam?.value)
                            );
                            break;
                        case "string":
                            parameters.push(
                                new StringParameter(p, inputParam?.value)
                            );
                            break;
                        case "boolean":
                            parameters.push(
                                new BooleanParameter(p, inputParam?.value)
                            );
                            break;
                        case "number":
                            parameters.push(
                                new NumberParameter(p, inputParam?.value)
                            );
                            break;
                        default:
                            parameters.push(
                                new InputParameter(p, inputParam?.value)
                            );
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

    private findPhraseOccurrence(phrase?: string): PhraseOccurrenceData | null {
        let returnValue: PhraseOccurrenceData | null = null;
        this.list.map((c) => {
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
        return returnValue;
    }
}
