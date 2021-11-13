import { ContextMenuCommandInit } from "./types/InitOptions.js";
import { CommandManager } from "../structures/CommandManager.js";
import { PermissionGuildCommand } from "./base/PermissionGuildCommand.js";
import { ContextType } from "./types/commands.js";
import { ContextMenuCommandObject } from "../structures/types/api.js";

/**
 * @class Representation of all context menu Discord interactions
 */
export class ContextMenuCommand extends PermissionGuildCommand {
    /**
     * Type of context menu interaction
     * @type {ContextType}
     */
    public readonly contextType: ContextType;

    /**
     * @constructor Context menu command constructor
     * @param manager - manager that this command belongs to
     * @param options - initialization options
     */
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

    /**
     * @returns Discord API object
     */
    public toObject(): ContextMenuCommandObject {
        return {
            ...super.toObject(),
            type: this.contextType === "USER" ? 2 : 3,
        };
    }
}
