import { BaseCommand } from "./BaseCommand.js";

export class CommandManager {
    private readonly _commands: BaseCommand[] = [];
    public readonly prefix?: string;
    public readonly argumentSeparator: string;

    constructor(prefix?: string, argSep?: string) {
        this.prefix = prefix;
        this.argumentSeparator = argSep || ",";
    }
}
