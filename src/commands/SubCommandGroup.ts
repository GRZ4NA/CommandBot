import { SubCommandGroupObject } from "../structures/apiTypes.js";
import { APICommandInit, Command } from "./base/Command.js";
import { ChatCommand } from "./ChatCommand.js";
import { SubCommand, SubCommandInit } from "./SubCommand.js";
import { CommandRegExps } from "./commandsTypes.js";

/**
 * Intialization options of subcommand group
 * @interface
 * @extends {APICommandInit}
 */
export interface SubCommandGroupInit extends APICommandInit {
    /**
     * Command description
     * @type {?string}
     */
    description?: string;
}

/**
 * Group of subcommands
 * @class
 */
export class SubCommandGroup extends Command {
    /**
     * Group members (children)
     * @type {Array<SubCommand>}
     * @private
     * @readonly
     */
    private readonly _children: SubCommand[] = [];
    /**
     * Group parent command
     * @type {ChatCommand}
     * @public
     * @readonly
     */
    public readonly parent: ChatCommand;
    /**
     * Group description (default: "No description")
     * @type {string}
     * @public
     * @readonly
     */
    public readonly description: string;

    /**
     * @constructor Group constructor
     * @param {ChatCommand} parent - group parent command
     * @param {SubCommandGroupInit} options - initialization options
     */
    constructor(parent: ChatCommand, options: SubCommandGroupInit) {
        super(parent.manager, "CHAT", {
            name: options.name,
            default_permission: options.default_permission,
        });

        this.parent = parent;
        this.description = options.description ?? "No description";

        if (!CommandRegExps.chatName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid group name (regexp: ${CommandRegExps.chatName})`);
        }
        if (this.description && !CommandRegExps.chatDescription.test(this.description)) {
            throw new Error(`The description of "${this.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
    }

    /**
     * List of subcommands attached to this group
     * @type {Array<SubCommand>}
     * @readonly
     */
    get children() {
        return Object.freeze([...this._children]);
    }

    /**
     * Attach a subcommand to this group
     * @param {SubCommandInit} options - subcommand initialization options
     * @returns {SubCommand} A computed {@link SubCommand} object
     * @public
     */
    public append(options: SubCommandInit): SubCommand {
        const sc = new SubCommand(this, options);
        if (this._children.find((c) => c.name === sc.name)) {
            throw new Error(`The name "${sc.name}" is already registered in "${this.name}"`);
        } else {
            this._children.push(sc);
            return sc;
        }
    }
    /**
     * @returns {SubCommandGroupObject} Discord API object
     * @public
     */
    public toObject(): SubCommandGroupObject {
        return {
            ...super.toObject(),
            type: 2 as 2,
            description: this.description,
            options: this._children.map((ch) => ch.toObject()),
        };
    }
}
