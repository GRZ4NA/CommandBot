import { Message } from "discord.js";
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
    get(phrase: string, mode?: GetMode): Command | null {
        if (!mode) mode = "ALL";
        let command: Command | null = null;
        this.list.map((c) => {
            switch (mode) {
                case "PREFIX":
                    if (c.name == phrase) {
                        command = c;
                    }
                    c.aliases.map((a) => {
                        if (a == phrase) {
                            command = c;
                        }
                    });
                    break;
                case "NO_PREFIX":
                    c.keywords.map((k) => {
                        if (k == phrase) {
                            command = c;
                        }
                    });
                    break;
                case "ALL":
                    if (c.name == phrase) {
                        command = c;
                    }
                    c.aliases.map((a) => {
                        if (a == phrase) {
                            command = c;
                        }
                    });
                    c.keywords.map((k) => {
                        if (k == phrase) {
                            command = c;
                        }
                    });
                    break;
            }
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
            this.list.map((c) => {
                command.keywords.map((k, i, a) => {
                    if (c.keywords.indexOf(k) != -1) {
                        console.warn(
                            `[⚠ WARN] The name "${k}" is already a registered KEYWORD for the "${c.name}" command. It will be removed from the "${command.name}" command`
                        );
                        a.splice(i, 1);
                    }
                });
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
    fetch(message: Message): CommandMessageStructure | null {
        if (!message.author.bot) {
            let prefix = false;
            if (message.content.startsWith(this.prefix)) {
                prefix = true;
            }
            const content = prefix
                ? message.content.replace(this.prefix, "")
                : message.content;
            const name = content.split(" ")[0];
            const command = this.get(name, prefix ? "PREFIX" : "NO_PREFIX");
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
                return {
                    command: command,
                    parameters: paramsList,
                };
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    private findPhraseOccurrence(phrase?: string): PhraseOccurrenceData | null {
        let returnValue: PhraseOccurrenceData | null = null;
        this.list.map((c) => {
            if (phrase == c.name) {
                returnValue = {
                    command: c,
                    type: "NAME",
                };
            } else if (c.aliases.indexOf(phrase || "") != -1) {
                returnValue = {
                    command: c,
                    type: "ALIAS",
                };
            }
        });
        return returnValue;
    }
}
