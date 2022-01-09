import { PermissionsError } from "../../errors.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { CommandPermissions } from "../../structures/CommandPermissions.js";
import { FunctionCommand, FunctionCommandInit } from "./FunctionCommand.js";
import { CommandType } from "../types/commands.js";
import { InputManager } from "../../structures/InputManager.js";
import { CommandPermissionsInit } from "../types/permissions.js";

/**
 * Executable command with attached permission system
 * @class
 * @extends {FunctionCommand}
 */
export class PermissionCommand extends FunctionCommand {
    /**
     * Object containing check functions and permission bitfields
     * @type {CommandPermissions}
     * @public
     * @readonly
     */
    public readonly permissions: CommandPermissions;

    /**
     * Constructor of command with attached permissions
     * @constructor
     * @param {CommandManager} manager - command manager attached to this command
     * @param {CommandType} type - command type
     * @param {PermissionCommandInit} options - command initalization options
     */
    constructor(manager: CommandManager, type: CommandType, options: PermissionCommandInit) {
        super(manager, type, {
            name: options.name,
            announceSuccess: options.announceSuccess,
            default_permission: options.default_permission,
            ephemeral: options.ephemeral,
            function: options.function,
        });

        this.permissions = new CommandPermissions(this, options.permissions);
    }

    /**
     * Invoke the command
     * @param {InputManager} input - input data
     * @returns {Promise<void>}
     * @public
     * @async
     */
    public async start(input: InputManager): Promise<void> {
        if (this.permissions.check(input.interaction)) {
            await super.start(input);
        } else {
            throw new PermissionsError(this);
        }
    }
}

/**
 * Initialization options of base command with attached permissions
 * @interface
 * @extends {FunctionCommandInit}
 */
export interface PermissionCommandInit extends FunctionCommandInit {
    /**
     * Object with permissions' options and resolvables
     * @type {?CommandPermissionsInit}
     */
    permissions?: CommandPermissionsInit;
}
