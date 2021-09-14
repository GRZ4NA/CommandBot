import { ChatCommandObject } from "../structures/types/api.js";
import { ChatCommand } from "./ChatCommand.js";
import { NestedCommand } from "./NestedCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { SubCommandInit } from "./types/SubCommand.js";

export class SubCommand extends ChatCommand {
    private readonly _parent: SubCommandGroup | NestedCommand;

    constructor(parent: SubCommandGroup | NestedCommand, o: SubCommandInit) {
        super(parent instanceof SubCommandGroup ? parent.parent.manager : parent.manager, {
            name: o.name,
            description: o.description,
            aliases: undefined,
            announceSuccess: o.announceSuccess,
            guilds: undefined,
            parameters: o.parameters,
            permissions: o.permissions,
            slash: true,
            usage: o.usage,
            visible: true,
            dm: o.dm,
            function: o.function,
        });
        this._parent = parent;
    }

    public toObject(): ChatCommandObject {
        return super.toObject();
    }
}
