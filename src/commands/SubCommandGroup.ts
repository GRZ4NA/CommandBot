import { NestedCommand } from "./NestedCommand.js";
import { CommandRegExps } from "./types/commands.js";
import { SubCommandGroupInit } from "./types/SubCommandGroup.js";

export class SubCommandGroup {
    private readonly _children: any[] = [];
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

    public append() {}
}
