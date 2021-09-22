import { ContextMenuCommandInit } from "./types/InitOptions.js";
import { CommandManager } from "../structures/CommandManager.js";
import { PermissionGuildCommand } from "./base/PermissionGuildCommand.js";
import { ContextType } from "./types/commands.js";
import { ContextMenuCommandObject } from "../structures/types/api.js";

export class ContextMenuCommand extends PermissionGuildCommand {
    public readonly contextType: ContextType;

    constructor(manager: CommandManager, options: ContextMenuCommandInit) {
        super(manager, "CONTEXT", {
            name: options.name,
            function: options.function,
            announceSuccess: options.announceSuccess,
            guilds: options.guilds,
            permissions: options.permissions,
            dm: options.dm,
        });

        this.contextType = options.contextType;
    }

    public toObject(): ContextMenuCommandObject {
        return {
            ...super.toObject(),
            type: this.contextType === "USER" ? 2 : 3,
        };
    }
}
