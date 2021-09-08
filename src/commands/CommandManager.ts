import { Interaction, Message } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { ChatCommand } from "./ChatCommand.js";
import { CommandType } from "./types/BaseCommand.js";
import { Command, CommandInteractionData, CommandList } from "./types/commands.js";

export class CommandManager {
    private readonly _commands: BaseCommand[] = [];
    public readonly prefix?: string;
    public readonly argumentSeparator: string;

    constructor(prefix?: string, argSep?: string) {
        this.prefix = prefix;
        this.argumentSeparator = argSep || ",";
    }

    public add(command: BaseCommand): void {}

    public get<T extends CommandType>(q: string, t?: T): Command<T> | null {
        return null;
    }

    public list<T extends CommandType>(filter?: T): CommandList<T> {
        switch (filter) {
            case "CHAT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CHAT")]) as CommandList<T>;
            case "USER":
            case "MESSAGE":
                return Object.freeze([...this._commands.filter((c) => c.type === "MESSAGE" || c.type === "USER")]) as CommandList<T>;
            default:
                return Object.freeze([...this._commands]) as CommandList<T>;
        }
    }

    public fetch<T extends Interaction | Message>(i: T): CommandInteractionData<T extends Interaction ? BaseCommand : ChatCommand> | null {
        return null;
    }
}
