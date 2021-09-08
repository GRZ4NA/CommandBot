import { ContextMenuCommandInit, ContextType } from "./types/ContextMenuCommand.js";
import { BaseCommand } from "./BaseCommand.js";
import { BaseCommandObject } from "structures/types/api.js";

export class ContextMenuCommand extends BaseCommand {
    public readonly contextType: ContextType;
    public static nameRegExp: RegExp = /^.{1,32}$/;

    constructor(o: ContextMenuCommandInit) {
        if (!ContextMenuCommand.nameRegExp.test(o.name)) {
            throw new Error("Incorrect command name. Command names must have 1-32 characters");
        }
        super("CONTEXT", {
            name: o.name,
            function: o.function,
            announceSuccess: o.announceSuccess,
            guilds: o.guilds,
            permissionCheck: o.permissionCheck,
            permissions: o.permissions,
        });
        this.contextType = o.contextType;
    }

    public toObject(): BaseCommandObject {
        const obj = super.toObject();
        obj.type = this.contextType === "USER" ? 2 : 3;
        return obj;
    }
}
