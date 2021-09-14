import { ContextMenuCommandInit, ContextType } from "./types/ContextMenuCommand.js";
import { BaseCommand } from "./BaseCommand.js";
import { BaseCommandObject } from "../structures/types/api.js";
import { CommandRegExps } from "./types/commands.js";
import { CommandManager } from "./CommandManager.js";

export class ContextMenuCommand extends BaseCommand {
    public readonly contextType: ContextType;

    constructor(manager: CommandManager, o: ContextMenuCommandInit) {
        if (!CommandRegExps.baseName.test(o.name)) {
            throw new Error(`"${o.name}" is not a valid command name (regexp: ${CommandRegExps.baseName})`);
        }
        super(manager, "CONTEXT", {
            name: o.name,
            function: o.function,
            announceSuccess: o.announceSuccess,
            guilds: o.guilds,
            permissions: o.permissions,
            dm: o.dm,
        });
        this.contextType = o.contextType;
    }

    public toObject(): BaseCommandObject {
        const obj = super.toObject();
        obj.type = this.contextType === "USER" ? 2 : 3;
        return obj;
    }
}
