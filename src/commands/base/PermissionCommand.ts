import { Interaction, Message } from "discord.js";
import { PermissionsError } from "../../errors.js";
import { TargetID } from "../../structures/parameter.js";
import { ParameterResolvable } from "../../structures/types/Parameter.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { CommandPermissions } from "../../structures/CommandPermissions.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { PermissionCommandInit } from "../types/InitOptions.js";
import { APICommandType } from "../../structures/types/api.js";

export class PermissionCommand extends FunctionCommand {
    /**
     * Object containing check functions and permission bitfields
     * @type {CommandPermissions}
     */
    public readonly permissions: CommandPermissions;

    constructor(manager: CommandManager, type: APICommandType, options: PermissionCommandInit) {
        super(manager, type, {
            name: options.name,
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
