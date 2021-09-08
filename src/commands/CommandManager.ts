import { Interaction, Message } from "discord.js";
import { TargetID } from "structures/parameter.js";
import { CommandNotFound } from "../errors.js";
import { applicationState } from "../state.js";
import { BaseCommand } from "./BaseCommand.js";
import { ChatCommand } from "./ChatCommand.js";
import { ContextMenuCommand } from "./ContextMenuCommand.js";
import { CommandType } from "./types/commands.js";
import { CommandInteractionData } from "./types/commands.js";

export class CommandManager {
    private readonly _commands: BaseCommand[] = [];
    public readonly prefix?: string;
    public readonly argumentSeparator: string;

    constructor(prefix?: string, argSep?: string) {
        this.prefix = prefix;
        this.argumentSeparator = argSep || ",";
    }

    public add(command: BaseCommand): void {
        if (applicationState.running) {
            console.warn(`[❌ ERROR] Cannot add command "${command.name}" while the application is running.`);
            return;
        }
        if (command.isChatCommand()) {
            if (this.list("CHAT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ChatCommand in this manager.`);
                return;
            }
            command.aliases &&
                command.aliases.length > 0 &&
                command.aliases.map((a, i, ar) => {
                    const r = this.get(a, "CHAT");
                    if (r) {
                        console.warn(
                            `[⚠️ WARNING] Cannot register alias "${a}" because its name is already being used in other command. Command "${command.name}" will be registered without this alias.`
                        );
                        ar.splice(i, 1);
                    }
                });
            this._commands.push(command);
            return;
        } else if (command.isContextMenuCommand()) {
            if (this.list("CONTEXT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ContextMenuCommand in this manager.`);
                return;
            }
            this._commands.push(command);
            return;
        }
    }

    public get(q: string, t?: undefined): BaseCommand | null;
    public get(q: string, t: "CHAT"): ChatCommand | null;
    public get(q: string, t: "CONTEXT"): ContextMenuCommand | null;
    public get(q: string, t?: CommandType): BaseCommand | null {
        if (t) {
            switch (t) {
                case "CHAT":
                    return (
                        this.list(t).find((c) => {
                            if (c.name === q) {
                                return true;
                            }
                            if (c.aliases && c.aliases.length > 0 && c.aliases.find((a) => a === q)) {
                                return true;
                            } else {
                                return false;
                            }
                        }) || null
                    );
                case "CONTEXT":
                    return this.list(t).find((c) => c.name === q) || null;
            }
        } else {
            return this.list().find((c) => c.name === q) || null;
        }
        return null;
    }

    public list(): readonly BaseCommand[];
    public list(f: "CHAT"): readonly ChatCommand[];
    public list(f: "CONTEXT"): readonly ContextMenuCommand[];
    public list(f?: CommandType): readonly BaseCommand[] {
        switch (f) {
            case "CHAT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CHAT")]);
            case "CONTEXT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CONTEXT")]);
            default:
                return Object.freeze([...this._commands]);
        }
    }

    public fetch(i: Interaction | Message): CommandInteractionData | null {
        if (i instanceof Interaction) {
            if (i.isCommand()) {
                const cmd = this.get(i.commandName, "CHAT");
                if (cmd) {
                    const args = cmd.processArguments(i.options.data.map((d) => d.value || null));
                    return {
                        command: cmd,
                        parameters: args,
                    };
                } else {
                    throw new CommandNotFound(i.commandName);
                }
            } else if (i.isContextMenu()) {
                const cmd = this.get(i.commandName, "CONTEXT");
                if (cmd) {
                    const target = new TargetID(i.targetId, i.targetType);
                    return {
                        command: cmd,
                        parameters: target,
                    };
                } else {
                    throw new CommandNotFound(i.commandName);
                }
            } else {
                return null;
            }
        } else if (this.prefix && i instanceof Message) {
            if (i.content.startsWith(this.prefix)) {
                const cmdName = i.content.replace(this.prefix, "").split(" ")[0];
                const cmd = this.get(cmdName, "CHAT");
                if (cmd) {
                    const argsRaw = i.content
                        .replace(`${this.prefix}${cmdName} `, "")
                        .split(this.argumentSeparator)
                        .map((a) => {
                            if (a.startsWith(" ")) {
                                return a.replace(" ", "");
                            } else {
                                return a;
                            }
                        });
                    const args = cmd.processArguments(argsRaw);
                    return {
                        command: cmd,
                        parameters: args,
                    };
                } else {
                    throw new CommandNotFound(cmdName);
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
}
