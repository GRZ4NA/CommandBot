import { ChatCommandObject } from "../structures/types/api.js";
import { ChatCommand } from "./ChatCommand.js";
import { NestedCommand } from "./NestedCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { SubCommandInit } from "./types/SubCommand.js";

export class SubCommand extends ChatCommand {
    private _parent?: SubCommandGroup | NestedCommand;

    constructor(o: SubCommandInit) {
        super({
            name: o.name,
            description: o.description,
            aliases: undefined,
            announceSuccess: o.announceSuccess,
            guilds: undefined,
            parameters: o.parameters,
            permissionCheck: o.permissionCheck,
            permissions: o.permissions,
            slash: true,
            usage: o.usage,
            visible: true,
            function: o.function,
        });
    }

    set parent(p: SubCommandGroup | NestedCommand) {
        if (!this._parent) {
            this._parent = p;
        } else {
            throw new Error("Parent has already been registered");
        }
    }

    public toObject(): ChatCommandObject {
        return super.toObject();
    }
}
