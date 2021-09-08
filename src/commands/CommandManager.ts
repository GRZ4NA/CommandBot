import { Interaction, Message } from "discord.js";
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

    public add(command: BaseCommand): void {}

    public get<T extends CommandType>(
        q: string,
        t?: T
    ): (T extends "CHAT" ? ChatCommand : T extends "MESSAGE" ? MessageCommand : T extends "USER" ? MessageCommand : BaseCommand) | null {
        return null;
    }

    public list<T extends CommandType>(
        filter?: T
    ): T extends "CHAT" ? ChatCommand[] : T extends "MESSAGE" ? MessageCommand[] : T extends "USER" ? MessageCommand[] : BaseCommand[] {
        return [];
    }

    public fetch<T extends Interaction | Message>(i: T): CommandInteractionData<T extends Interaction ? BaseCommand : ChatCommand> | null {
        return null;
    }
}
