import { APICommand } from "./base/APICommand.js";
import { NestedCommand } from "./NestedCommand.js";
import { SubCommand } from "./SubCommand.js";
import { CommandRegExps } from "./types/commands.js";
import { SubCommandInit, SubCommandGroupInit } from "./types/InitOptions.js";

export class SubCommandGroup extends APICommand {
    protected readonly _parent: NestedCommand;
    private readonly _children: SubCommand[] = [];
    public readonly description: string;

    constructor(parent: NestedCommand, options: SubCommandGroupInit) {
        super(parent.manager, {
            name: options.name,
            type: "CHAT_INPUT",
            default_permission: options.default_permission,
        });
        if (!CommandRegExps.chatName.test(options.name)) {
            throw new Error(`"${options.name}" is not a valid group name (regexp: ${CommandRegExps.chatName})`);
        }
        if (options.description && !CommandRegExps.chatDescription.test(options.description)) {
            throw new Error(`The description of "${options.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
        this._parent = parent;
        this.description = options.description || "No description";
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
}
