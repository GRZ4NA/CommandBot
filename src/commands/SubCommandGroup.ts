import { SubCommandGroupObject } from "structures/types/api.js";
import { NestedCommand } from "./NestedCommand.js";
import { SubCommand } from "./SubCommand.js";
import { CommandRegExps } from "./types/commands.js";
import { SubCommandGroupInit } from "./types/SubCommandGroup.js";

export class SubCommandGroup {
    private readonly _children: SubCommand[] = [];
    private _parent?: NestedCommand | SubCommandGroup;
    public readonly name: string;
    public readonly description: string;

    constructor(o: SubCommandGroupInit) {
        if (!CommandRegExps.chatName.test(o.name)) {
            throw new Error(`"${o.name}" is not a valid group name (regexp: ${CommandRegExps.chatName})`);
        }
        if (!CommandRegExps.chatDescription.test(o.description)) {
            throw new Error(`The description of "${o.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
        this.name = o.name;
        this.description = o.description || "No description";
    }

    set parent(p: NestedCommand | SubCommandGroup) {
        if (!this._parent) {
            this._parent = p;
        } else {
            throw new Error("Parent has already been registered");
        }
    }

    get children() {
        return Object.freeze([...this._children]);
    }

    public append(sc: SubCommand): SubCommand {
        if (this._children.find((c) => sc.name === c.name)) {
            throw new Error(`There is already a command with the name "${sc.name}" registered in "${this.name}"`);
        } else {
            sc.parent = this;
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
