//IMPORTS
import {
    Permissions,
    PermissionResolvable,
    Message,
    MessageEmbed,
} from "discord.js";
import { MissingArgumentError, PermissionsError } from "./Error.js";
import { Argument, ArgumentResolvable, ProcessArgument } from "./Arguments.js";

//TYPE DEFINITIONS
type GetMode = "ALL" | "PREFIX" | "NO_PREFIX";
type PermissionCheckTypes = "ALL" | "ANY";
export interface CommandMessageStructure {
    command: Command;
    arguments: ArgumentResolvable[];
}
interface CommandBuilder {
    name: string;
    arguments?: Argument[];
    aliases?: string[] | string;
    keywords?: string[] | string;
    description?: string;
    usage?: string;
    permissionCheck?: PermissionCheckTypes;
    permissions?: PermissionResolvable;
    visible?: boolean;
    function: (
        message?: Message,
        cmdArguments?: ArgumentResolvable[]
    ) => void | string | MessageEmbed | Promise<void | string | MessageEmbed>;
}
interface PhraseOccurrenceData {
    command: Command;
    type: "NAME" | "ALIAS";
}

//CLASSES
export class Command {
    name: string;
    arguments: Argument[];
    aliases: string[];
    keywords: string[];
    description: string;
    usage: string;
    permissionCheck: PermissionCheckTypes;
    permissions: Permissions;
    visible: boolean;
    private function: (
        message?: Message,
        cmdArguments?: ArgumentResolvable[]
    ) => void | string | MessageEmbed | Promise<void | string | MessageEmbed>;

    /**
     * Command constructor
     * @constructor
     * @param {CommandBuilder} options - all command properties
     * @param {string} options.name - command name (used to trigger the command)
     * @param {string | string[]} [options.aliases] - other words that can trigger the command with prefix
     * @param {string | string[]} [options.keywords] - other words that can trigger the command without prefix
     * @param {string} [options.description="No description"] - command description shown in the help message
     * @param {string} [options.usage] - command usage description shown in the help message
     * @param {PermissionCheckTypes} [options.permissionCheck='ANY'] - specifies if the caller has to have all of the specified permissions or any of that
     * @param {PermissionResolvable} [options.permissions] - permissions needed to run the command
     * @param {boolean} [options.visible=true] - show command in the help message
     * @param {Function} options.function - function that will trigger when the commands gets called
     */
    constructor(options: CommandBuilder) {
        this.name = options.name.split(" ").join("_");
        this.arguments = options.arguments || [];
        this.aliases = Command.processPhrase(options.aliases);
        this.keywords = Command.processPhrase(options.keywords);
        this.description = options.description || "No description";
        this.usage = options.usage || this.generateUsageFromArguments();
        this.permissionCheck =
            options.permissionCheck == "ALL" || options.permissionCheck == "ANY"
                ? options.permissionCheck
                : "ANY";
        this.permissions = new Permissions(options.permissions || 0);
        this.visible = options.visible != undefined ? options.visible : true;
        this.function = options.function;
    }

    /**
     * Starts the command
     * @param {Message} [message] - a *Message* object used to check caller's permissions. It will get passed to the execution function (specified in *function* property of command's constructor)
     * @param {string[]} [cmdArguments] - list of processed arguments passed in a Discord message
     * @returns *Promise<void>*
     */
    async start(
        message?: Message,
        cmdArguments?: ArgumentResolvable[]
    ): Promise<void> {
        const memberPermissions: Readonly<Permissions> =
            message?.member?.permissions || new Permissions(0);
        if (
            this.permissionCheck == "ALL"
                ? memberPermissions.has(this.permissions, true)
                : memberPermissions.any(this.permissions, true)
        ) {
            const fnResult = await this.function(message, cmdArguments);
            if (typeof fnResult == "string") {
                await message?.reply(fnResult);
            } else if (fnResult instanceof MessageEmbed) {
                await message?.channel.send(fnResult);
            }
        } else {
            throw new PermissionsError(this, message?.member);
        }
    }

    private static processPhrase(phrase?: string | string[]): string[] {
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
            return [];
        }
    }

    private generateUsageFromArguments(): string {
        let usageTemplate: string = "";
        this.arguments.map((e) => {
            usageTemplate += `[${e.name} (${e.type}${
                e.optional ? ", optional" : ""
            })] `;
        });
        return usageTemplate;
    }
}
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
                        `WARN! The name "${a}" is already registered as ${aliasOccurrence.type} in the "${aliasOccurrence.command.name}" command. It will be removed from the "${command.name}" command.`
                    );
                    ar.splice(i, 1);
                }
            });
            this.list.map((c) => {
                command.keywords.map((k, i, a) => {
                    if (c.keywords.indexOf(k) != -1) {
                        console.warn(
                            `WARN! The name "${k}" is already a registered KEYWORD for the "${c.name}" command. It will be removed from the "${command.name}" command`
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
     * Fetches command and arguments from the given *Message* object
     * @param {Message} message - *Message* object
     * @returns *CommandMessagesStructure* | *null*
     */
    fetch(message: Message): CommandMessageStructure | null {
        if (!message.author.bot) {
            const content = message.content.startsWith(this.prefix)
                ? message.content.replace(this.prefix, "")
                : message.content;
            const name = content.split(" ")[0];
            const command = this.get(name, "ALL");
            if (command) {
                const argumentsText = content.replace(name, "");
                const argumentsList: ArgumentResolvable[] = argumentsText
                    .split(this.argumentSeparator)
                    .map((a) => {
                        return a.replace(" ", "");
                    });
                if (
                    (argumentsList[0] == "" || argumentsList[0] == " ") &&
                    argumentsList.length == 1
                ) {
                    argumentsList.splice(0, 1);
                }
                if (command.arguments) {
                    command.arguments.map((a, i) => {
                        if (!argumentsList[i] && !a.optional) {
                            throw new MissingArgumentError(a);
                        } else {
                            argumentsList[i] = ProcessArgument(
                                argumentsList[i] as string,
                                a.type
                            );
                        }
                    });
                }
                return {
                    command: command,
                    arguments: argumentsList,
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
