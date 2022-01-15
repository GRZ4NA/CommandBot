import { ContextMenuCommandInit } from "./types/InitOptions";
import { CommandManager } from "../structures/CommandManager";
import { PermissionGuildCommand } from "./base/PermissionGuildCommand";
import { ContextType } from "./types/commands";
import { ContextMenuCommandObject } from "../structures/types/api";

/**
 * Representation of all context menu Discord interactions
 * @class
 */
export class ContextMenuCommand extends PermissionGuildCommand {
    /**
     * Type of context menu interaction
     * @type {ContextType}
     * @public
     * @readonly
     */
    public readonly contextType: ContextType;

    /**
     * Context menu command constructor
     * @constructor
     * @param {CommandManager} manager - manager that this command belongs to
     * @param {ContextMenuCommandInit} options - initialization options
     */
    constructor(manager: CommandManager, options: ContextMenuCommandInit) {
        super(manager, "CONTEXT", {
            name: options.name,
            function: options.function,
            announceSuccess: options.announceSuccess,
            guilds: options.guilds,
            permissions: options.permissions,
            dm: options.dm,
            ephemeral: options.ephemeral,
        });

        this.contextType = options.contextType;
    }
    /**
     * @returns {ContextMenuCommandObject} Discord API object
     * @public
     */
    public toObject(): ContextMenuCommandObject {
        return {
            ...super.toObject(),
            type: this.contextType === "USER" ? 2 : 3,
        };
    }
}
