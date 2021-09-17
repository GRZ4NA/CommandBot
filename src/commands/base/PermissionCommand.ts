import { Interaction, Message } from "discord.js";
import { PermissionsError } from "../../errors.js";
import { TargetID } from "../../structures/parameter.js";
import { ParameterResolvable } from "../../structures/types/Parameter.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { CommandPermissions } from "../../structures/CommandPermissions.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { PermissionCommandInit } from "../types/InitOptions.js";

export class PermissionCommand extends FunctionCommand {
    /**
     * Object containing check functions and permission bitfields
     * @type {CommandPermissions}
     */
    public readonly permissions: CommandPermissions;

    constructor(manager: CommandManager, options: PermissionCommandInit) {
        super(manager, {
            name: options.name,
            type: options.type,
            announceSuccess: options.announceSuccess,
            default_permission: options.default_permission,
            function: options.function,
        });
        this.permissions = new CommandPermissions(this, options.permissions);
    }

    public async start(args: ReadonlyMap<string, ParameterResolvable>, interaction: Message | Interaction, target?: TargetID): Promise<void> {
        if (this.permissions.check(interaction)) {
            await super.start(args, interaction, target);
        } else {
            throw new PermissionsError(this);
        }
    }
}
