import { GuildMember } from "discord.js";
import { Command } from "./commands/base/Command";
import { Parameter } from "./structures/Parameter";
import { ParameterResolvable, ParameterType } from "./structures/Parameter";

/**
 * Error indicating that a caller doesn't have enough permissions to execute a command
 * @class
 * @extends {Error}
 */
export class PermissionsError extends Error {
    /**
     * Command that user wanted and failed to invoke
     * @type {Command}
     * @private
     * @readonly
     */
    private readonly command: Command;
    /**
     * User that doesn't have the permissions
     * @type {?GuildMember}
     * @private
     * @readonly
     */
    private readonly user: GuildMember | null;

    /**
     * @constructor
     * @param {Command} command - command that user wanted and failed to invoke
     * @param {?GuildMember} [user] - user that doesn't have the permissions
     */
    constructor(command: Command, user?: GuildMember | null) {
        super();
        this.command = command;
        this.user = user || null;
    }

    /**
     * Converts error object to user-readable message
     * @returns {string} Formatted error message
     * @public
     */
    public toString() {
        return `User ${this.user?.user.tag} doesn't have enough permissions to run "${this.command.name}" command`;
    }
}
/**
 * Error indicating that an input value cannot be converted to a expected type
 * @class
 * @extends {TypeError}
 */
export class ParameterTypeError extends TypeError {
    /**
     * Value converted to a string
     * @type {string}
     * @private
     * @readonly
     */
    private readonly stringContent: string;
    /**
     * Expected type
     * @type {ParameterType}
     * @private
     * @readonly
     */
    private readonly type: ParameterType;

    /**
     * @constructor
     * @param {ParameterResolvable} s - value with an invalid type
     * @param {ParameterType} type - expected type
     */
    constructor(s: ParameterResolvable, type: ParameterType) {
        super();
        this.stringContent = s?.toString() ?? "";
        this.type = type;
    }

    /**
     * Converts error object to user-readable message
     * @returns {string} Formatted error message
     * @public
     */
    public toString() {
        return `Parameter "${this.stringContent}" cannot be converted to ${this.type}`;
    }
}
/**
 * Error indicating that a required parameter is missing in the request
 * @class
 * @extends {ReferenceError}
 */
export class MissingParameterError extends ReferenceError {
    /**
     * Missing parameter object
     * @type {Parameter<any>}
     * @private
     * @readonly
     */
    private readonly argument: Parameter<any>;

    /**
     * @constructor
     * @param {Parameter<any>} a - missing parameter object
     */
    constructor(a: Parameter<any>) {
        super();
        this.argument = a;
    }

    /**
     * Converts error object to user-readable message
     * @returns {string} Formatted error message
     * @public
     */
    public toString() {
        return `Your request is missing a "${this.argument.name}" parameter which is not optional`;
    }
}
/**
 * Object indicating command execution success
 * @class
 */
export class OperationSuccess {
    /**
     * Command that succeeded
     * @type {Command}
     * @public
     * @readonly
     */
    public readonly command: Command;

    /**
     * @constructor
     * @param {Command} c - command that succeeded
     */
    constructor(c: Command) {
        this.command = c;
    }
}
/**
 * Error thrown when there is no command with the given name
 * @class
 * @extends {Error}
 */
export class CommandNotFound extends Error {
    /**
     * User query
     * @type {string}
     * @public
     * @readonly
     */
    public readonly query?: string;

    /**
     * @constructor
     * @param {?string} [q] - user query
     */
    constructor(q?: string) {
        super("Command not found");
        this.query = q;
    }
}
