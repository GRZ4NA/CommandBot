import { Command } from "./Command.js";
import { GuildMember } from "discord.js";
import { Argument, ArgumentType } from "Arguments.js";

export class PermissionsError extends Error {
    private command: Command;
    private user: GuildMember | null;
    constructor(command: Command, user?: GuildMember | null) {
        super();
        this.command = command;
        this.user = user || null;
    }
    toString() {
        return `User ${this.user?.user.tag} doesn't have enough permissions to run "${this.command.name}" command`;
    }
}

export class ArgumentTypeError extends TypeError {
    private stringContent: string;
    private type: ArgumentType;
    constructor(s: string, type: ArgumentType) {
        super();
        this.stringContent = s;
        this.type = type;
    }
    toString() {
        return `Argument "${this.stringContent}" cannot be converted to ${this.type}`;
    }
}

export class MissingArgumentError extends ReferenceError {
    private argument: Argument;
    constructor(a: Argument) {
        super();
        this.argument = a;
    }
    toString() {
        return `Your request is missing a "${this.argument.name}" argument which is not optional`;
    }
}
