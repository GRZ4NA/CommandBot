import { NestedCommand } from "./NestedCommand.js";
import { SubCommandGroupInit } from "./types/SubCommandGroup.js";

export class SubCommandGroup {
    private readonly _children: any[] = [];
    private _parent?: NestedCommand | SubCommandGroup;
    public readonly name: string;
    public static nameRegExp: RegExp = /^[\w-]{1,32}$/;

    constructor(o: SubCommandGroupInit) {
        if (!SubCommandGroup.nameRegExp.test(o.name)) {
            throw new Error("Incorrect group name");
        }
        this.name = o.name;
    }

    set parent(p: NestedCommand | SubCommandGroup) {
        if (!this._parent) {
            this._parent = p;
        } else {
            throw new Error("Parent already registered");
        }
    }

    public append() {}
}
