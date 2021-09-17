import { ContextMenuCommandInit } from "./types/InitOptions.js";
import { CommandManager } from "../structures/CommandManager.js";
import { PermissionGuildCommand } from "./base/PermissionGuildCommand.js";

export class ContextMenuCommand extends PermissionGuildCommand {
    constructor(manager: CommandManager, options: ContextMenuCommandInit) {
        super(manager, options.type, {
            name: options.name,
            function: options.function,
            announceSuccess: options.announceSuccess,
            guilds: options.guilds,
            permissions: options.permissions,
            dm: options.dm,
        });
    }
}
