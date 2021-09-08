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

    public get(q: string, t?: undefined): BaseCommand | null;
    public get(q: string, t: "CHAT"): ChatCommand | null;
    public get(q: string, t: "MESSAGE"): MessageCommand | null;
    public get(q: string, t?: CommandType): BaseCommand | null {
        return null;
    }

    public list(): BaseCommand[];
    public list(f: "CHAT"): ChatCommand[];
    public list(f: "MESSAGE"): MessageCommand[];
    public list(f?: CommandType): BaseCommand[] {
        return [];
    }

    public fetch<T extends Interaction | Message>(interaction: T): CommandInteractionData<T> | null {
        return null;
    }
}
