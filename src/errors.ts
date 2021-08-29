import { Command } from "./Command.js";
import { GuildMember } from "discord.js";
import { Parameter } from "./Parameter.js";
import { ParameterType } from "./types.js";

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

export class ParameterTypeError extends TypeError {
    private stringContent: string;
    private type: ParameterType;
    constructor(s: string, type: ParameterType) {
        super();
        this.stringContent = s;
        this.type = type;
    }
    toString() {
        return `Parameter "${this.stringContent}" cannot be converted to ${this.type}`;
    }
}

export class MissingParameterError extends ReferenceError {
    private argument: Parameter;
    constructor(a: Parameter) {
        super();
        this.argument = a;
    }
    toString() {
        return `Your request is missing a "${this.argument.name}" parameter which is not optional`;
    }
}

export class OperationSuccess {
    command: Command;
    constructor(c: Command) {
        this.command = c;
    }
}
