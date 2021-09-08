import { Interaction, Message } from "discord.js";
import { applicationState } from "state.js";
import { BaseCommand } from "./BaseCommand.js";
import { ChatCommand } from "./ChatCommand.js";
import { MessageCommand } from "./MessageCommand.js";
import { CommandType } from "./types/BaseCommand.js";
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
            if (this.list("MESSAGE").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ContextMenuCommand in this manager.`);
                return;
            }
            this._commands.push(command);
            return;
        }
    }

    public get(q: string, t?: undefined): BaseCommand | null;
    public get(q: string, t: "CHAT"): ChatCommand | null;
    public get(q: string, t: "MESSAGE"): MessageCommand | null;
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
                case "MESSAGE":
                    return this.list(t).find((c) => c.name === q) || null;
            }
        } else {
            return this.list().find((c) => c.name === q) || null;
        }
        return null;
    }

    public list(): readonly BaseCommand[];
    public list(f: "CHAT"): readonly ChatCommand[];
    public list(f: "MESSAGE"): readonly MessageCommand[];
    public list(f?: CommandType): readonly BaseCommand[] {
        switch (f) {
            case "CHAT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CHAT")]);
            case "USER":
            case "MESSAGE":
                return Object.freeze([...this._commands.filter((c) => c.type === "MESSAGE" || c.type === "USER")]);
            default:
                return Object.freeze([...this._commands]);
        }
    }

    public fetch<T extends Interaction | Message>(interaction: T): CommandInteractionData<T> | null {
        return null;
    }
}
