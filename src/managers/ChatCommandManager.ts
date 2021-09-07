import { CommandInteraction, CommandInteractionOption, Message } from "discord.js";
import { CommandNotFound, MissingParameterError } from "../errors";
import { BooleanParameter, InputParameter, NullParameter, NumberParameter, ObjectParameter, Parameter, StringParameter } from "../structures/Parameter";
import { CommandMessageStructure as ChatCommandInteractionData } from "../types/ChatCommand";
import { ChatCommand } from "../structures/ChatCommand";
import { CommandManager } from "./CommandManager.js";

export class ChatCommandManager extends CommandManager {
    protected readonly _list: ChatCommand[] = [];
    public readonly prefix?: string;
    public readonly parameterSeparator: string;

    constructor(prefix?: string, parameterSeparator?: string) {
        super();
        this.prefix = prefix;
        this.parameterSeparator = parameterSeparator || ",";
    }

    public get(q: string): ChatCommand | null {
        const cmd = (super.get(q) as ChatCommand) || null;
        if (!cmd) {
            this._list.map((c) => {
                if (c.aliases) {
                    if (c.aliases.find((a) => a === q)) {
                        return c;
                    }
                }
            });
            return null;
        } else {
            return cmd;
        }
    }

    public add(command: ChatCommand): void {
        try {
            if (ChatCommand.isCommand(command)) {
                if (command.aliases && command.aliases.length > 0) {
                    command.aliases.map((a, i, ar) => {
                        const existingPhraseCmd: ChatCommand | null =
                            this._list.find((c) => {
                                if (c.aliases && c.aliases.length > 0) {
                                    if (c.aliases.find((w) => w === a)) {
                                        return true;
                                    }
                                } else {
                                    return false;
                                }
                            }) || null;
                        if (existingPhraseCmd) {
                            console.warn(
                                `[⚠️ WARNING] The alias "${a}" is already registered in the "${existingPhraseCmd.name}" command. It won't be included in the "${command.name}" command.`
                            );
                            ar.splice(i, 1);
                        }
                    });
                }
                super.add(command);
            } else {
                throw new Error("Incorrect argument type");
            }
        } catch (e) {
            console.error(`[❌ ERROR] ${e}`);
        }
    }

    public fetch(i: Message | CommandInteraction): ChatCommandInteractionData | null {
        if (i instanceof Message) {
            if (!this.prefix || i.author.bot || !i.content.startsWith(this.prefix)) return null;
            else {
                const messageContentRaw = i.content.replace(this.prefix, "").split(" ");
                const command = this.get(messageContentRaw[0]);
                if (command) {
                    messageContentRaw.splice(0, 1);
                    const argsRaw = messageContentRaw
                        .join(" ")
                        .split(this.parameterSeparator)
                        .map((arg) => arg.replace(" ", ""));
                    if ((argsRaw[0] == "" || argsRaw[0] == " ") && argsRaw.length == 1) {
                        argsRaw.splice(0, 1);
                    }
                    if (command.parameters.length > 0) {
                        const args: InputParameter[] = this.processRawInput(argsRaw, command.parameters);
                        return {
                            command: command,
                            parameters: args,
                        };
                    } else {
                        return {
                            command: command,
                            parameters: [],
                        };
                    }
                } else {
                    throw new CommandNotFound(messageContentRaw[0]);
                }
            }
        } else if (i instanceof CommandInteraction && i.isCommand()) {
            const command = this.get(i.commandName);
            if (command) {
                if (command.parameters.length > 0) {
                    const argsRaw = i.options.data.map((a) => a.value?.toString() || "");
                    const args = this.processRawInput(argsRaw, command.parameters);
                    return {
                        command: command,
                        parameters: args,
                    };
                }
                return {
                    command: command,
                    parameters: [],
                };
            } else {
                throw new CommandNotFound(i.commandName);
            }
        } else {
            return null;
        }
    }

    private processRawInput(args: string[], schema: Parameter[]): InputParameter[] {
        return schema.map((p, i) => {
            if (!p.optional && !args[i]) {
                throw new MissingParameterError(p);
            } else if (p.optional && !args[i]) {
                return new NullParameter(p);
            }
            switch (p.type) {
                case "mentionable":
                case "channel":
                case "role":
                case "user":
                    return new ObjectParameter(p, args[i]);
                case "string":
                    return new StringParameter(p, args[i]);
                case "boolean":
                    return new BooleanParameter(p, args[i]);
                case "number":
                    return new NumberParameter(p, args[i]);
                default:
                    return new InputParameter(p, args[i]);
            }
        });
    }
}
