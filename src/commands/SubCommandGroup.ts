import { SubCommandGroupObject } from "../structures/types/api.js";
import { NestedCommand } from "./NestedCommand.js";
import { SubCommand } from "./SubCommand.js";
import { CommandRegExps } from "./types/commands.js";
import { SubCommandInit } from "./types/SubCommand.js";
import { SubCommandGroupInit } from "./types/SubCommandGroup.js";

export class SubCommandGroup {
    protected readonly _parent: NestedCommand;
    private readonly _children: SubCommand[] = [];
    public readonly name: string;
    public readonly description: string;

    constructor(parent: NestedCommand, o: SubCommandGroupInit) {
        if (!CommandRegExps.chatName.test(o.name)) {
            throw new Error(`"${o.name}" is not a valid group name (regexp: ${CommandRegExps.chatName})`);
        }
        if (o.description && !CommandRegExps.chatDescription.test(o.description)) {
            throw new Error(`The description of "${o.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
        this.name = o.name;
        this.description = o.description || "No description";
        this._parent = parent;
    }

    get children() {
        return Object.freeze([...this._children]);
    }

    get parent() {
        return this._parent;
    }

    public append(options: SubCommandInit): SubCommand {
        const sc = new SubCommand(this, options);
        if (this._children.find((c) => c.name === sc.name)) {
            throw new Error(`The name "${sc.name}" is already registered in "${this.name}"`);
        } else {
            this._children.push(sc);
            return sc;
        }
    }

    public toObject(): SubCommandGroupObject {
        return {
            name: this.name,
            description: this.description,
            type: 2,
            options: this._children.map((c) => c.toObject()),
        };
    }
}
