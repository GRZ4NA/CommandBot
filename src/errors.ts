import { BaseCommand } from "./structures/BaseCommand.js";
import { GuildMember } from "discord.js";
import { Parameter } from "./structures/Parameter.js";
import { ParameterType } from "./types/Parameter.js";

/**
 * @class Error indicating that a caller doesn't have enough permissions to execute a command
 * @extends Error
 * @exports
 */
export class PermissionsError extends Error {
    private readonly command: BaseCommand;

    private readonly user: GuildMember | null;

    constructor(command: BaseCommand, user?: GuildMember | null) {
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
 * @exports
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
 * @exports
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
 * @exports
 */
export class OperationSuccess {
    public readonly command: BaseCommand;

    constructor(c: BaseCommand) {
        this.command = c;
    }
}
