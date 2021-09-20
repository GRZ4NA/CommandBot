import { SubCommandGroupObject } from "../structures/types/api.js";
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
        super(parent.manager, "CHAT_INPUT", {
            name: options.name,
            default_permission: options.default_permission,
        });

        this._parent = parent;
        this.description = options.description || "No description";

        if (!CommandRegExps.chatName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid group name (regexp: ${CommandRegExps.chatName})`);
        }
        if (this.description && !CommandRegExps.chatDescription.test(this.description)) {
            throw new Error(`The description of "${this.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
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
            ...super.toObject(),
            type: 2 as 2,
            description: this.description,
            options: this._children.map((ch) => ch.toObject()),
        };
    }
}
