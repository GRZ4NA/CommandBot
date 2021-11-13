import { PermissionsError } from "../../errors.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { CommandPermissions } from "../../structures/CommandPermissions.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { PermissionCommandInit } from "../types/InitOptions.js";
import { CommandType } from "../types/commands.js";
import { InputManager } from "../../structures/InputManager.js";

/**
 * @class Executable command with attached permission system
 */
export class PermissionCommand extends FunctionCommand {
    /**
     * Object containing check functions and permission bitfields
     * @type {CommandPermissions}
     */
    public readonly permissions: CommandPermissions;

    /**
     * @constructor Constructor of command with attached permissions
     * @param manager - command manager attached to this command
     * @param type - command type
     * @param options - command initalization options
     */
    constructor(manager: CommandManager, type: CommandType, options: PermissionCommandInit) {
        super(manager, type, {
            name: options.name,
            announceSuccess: options.announceSuccess,
            default_permission: options.default_permission,
            function: options.function,
        });

        this.permissions = new CommandPermissions(this, options.permissions);
    }

    /**
     * Invoke the command
     * @param input - input data
     */
    public async start(input: InputManager): Promise<void> {
        if (this.permissions.check(input.interaction)) {
            await super.start(input);
        } else {
            throw new PermissionsError(this);
        }
    }
}
