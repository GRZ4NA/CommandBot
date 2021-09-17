import { generateUsageFromArguments } from "../utils/generateUsageFromArguments.js";
import { DefaultParameter, Parameter } from "../structures/parameter.js";
import { PermissionCommand } from "./base/PermissionCommand.js";
import { NestedCommand } from "./NestedCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { CommandRegExps } from "./types/commands.js";
import { SubCommandInit } from "./types/InitOptions.js";

export class SubCommand extends PermissionCommand {
    private readonly _parent: SubCommandGroup | NestedCommand;
    /**
     * Command description displayed in the help message or in slash commands menu (Default description: "No description")
     * @type {string}
     */
    public readonly description: string;
    /**
     * List of parameters that can passed to this command
     * @type {Array} {@link Parameter}
     */
    public readonly parameters: Parameter[];
    /**
     * Command usage displayed in the help message
     * @type {string}
     */
    public readonly usage?: string;

    constructor(parent: SubCommandGroup | NestedCommand, options: SubCommandInit) {
        if (!CommandRegExps.chatName.test(options.name)) {
            throw new Error(`"${options.name}" is not a valid command name (regexp: ${CommandRegExps.chatName})`);
        }
        if (options.description && !CommandRegExps.chatDescription.test(options.description)) {
            throw new Error(`The description of "${options.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
        super(parent instanceof SubCommandGroup ? parent.parent.manager : parent.manager, "CHAT_INPUT", {
            name: options.name,
            announceSuccess: options.announceSuccess,
            permissions: options.permissions,
            function: options.function,
        });
        this._parent = parent;
        this.description = options.description || "No description";
        if (options.parameters == "no_input" || !options.parameters) {
            this.parameters = [];
        } else if (options.parameters == "simple") {
            this.parameters = [new DefaultParameter()];
        } else {
            this.parameters = options.parameters.map((ps) => new Parameter(ps));
        }
        this.usage = options.usage || generateUsageFromArguments(this);
    }
}
