import { Command } from "./commands/base/Command.js";
import { GuildMember } from "discord.js";
import { Parameter } from "./structures/parameter.js";
import { ParameterType } from "./structures/types/Parameter.js";

/**
 * @class Error indicating that a caller doesn't have enough permissions to execute a command
 * @extends Error
 */
export class PermissionsError extends Error {
    private readonly command: Command;
    private readonly user: GuildMember | null;

    constructor(command: Command, user?: GuildMember | null) {
        super();
        this.command = command;
        this.user = user || null;
    }

    public toString() {
        return `User ${this.user?.user.tag} doesn't have enough permissions to run "${this.command.name}" command`;
    }
}

/**
 * @class Error indicating that an input value cannot be converted to a expected type
 * @extends TypeError
 */
export class ParameterTypeError extends TypeError {
    private readonly stringContent: string;
    private readonly type: ParameterType;

    constructor(s: string, type: ParameterType) {
        super();
        this.stringContent = s;
        this.type = type;
    }

    public toString() {
        return `Parameter "${this.stringContent}" cannot be converted to ${this.type}`;
    }
}

/**
 * @class Error indicating that a required parameter is missing in the request
 * @extends ReferenceError
 */
export class MissingParameterError extends ReferenceError {
    private readonly argument: Parameter;

    constructor(a: Parameter) {
        super();
        this.argument = a;
    }

    public toString() {
        return `Your request is missing a "${this.argument.name}" parameter which is not optional`;
    }
}

/**
 * @class Entity indicating command execution success
 */
export class OperationSuccess {
    public readonly command: Command;

    constructor(c: Command) {
        this.command = c;
    }
}

export class CommandNotFound extends Error {
    public readonly query?: string;

    constructor(q?: string) {
        super("Command not found");
        this.query = q;
    }
}
