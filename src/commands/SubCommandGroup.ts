import { NestedCommand } from "./NestedCommand.js";
import { SubCommand } from "./SubCommand.js";
import { CommandRegExps } from "./types/commands.js";
import { SubCommandGroupInit } from "./types/SubCommandGroup.js";

export class SubCommandGroup {
    private readonly _children: SubCommand[] = [];
    private _parent?: NestedCommand | SubCommandGroup;
    public readonly name: string;

    constructor(o: SubCommandGroupInit) {
        if (!CommandRegExps.chatName.test(o.name)) {
            throw new Error(`"${o.name}" is not a valid group name (regexp: ${CommandRegExps.chatName})`);
        }
        this.name = o.name;
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
}
