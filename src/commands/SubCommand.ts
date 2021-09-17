import { MissingParameterError, ParameterTypeError } from "../errors.js";
import { ParameterResolvable } from "../structures/types/Parameter.js";
import { DefaultParameter, ObjectID, Parameter } from "../structures/parameter.js";
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
        super(parent instanceof SubCommandGroup ? parent.parent.manager : parent.manager, {
            name: options.name,
            type: "CHAT_INPUT",
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
        this.usage = options.usage || this.generateUsageFromArguments();
    }

    private generateUsageFromArguments(): string {
        let usageTemplate: string = "";
        this.parameters &&
            this.parameters.map((e) => {
                usageTemplate += `[${e.name} (${e.choices ? e.choices.join(" / ") : e.type}${e.optional ? ", optional" : ""})] `;
            });
        return usageTemplate;
    }

    /**
     *
     * @param {ParameterResolvable[]} args - array of input data from Discord
     * @returns {ReadonlyMap<string, ParameterResolvable>} A map containing all input data bound to parameter names
     */
    public processArguments(args: ParameterResolvable[]): ReadonlyMap<string, ParameterResolvable> {
        if (this.parameters) {
            const mapEntries: [string, ParameterResolvable][] = this.parameters.map((p, i) => {
                if (!p.optional && !args[i]) {
                    throw new MissingParameterError(p);
                } else if (p.optional && !args[i]) {
                    return [p.name, null];
                } else if (p.type === "channel" || p.type === "mentionable" || p.type === "role" || p.type === "user") {
                    return [p.name, new ObjectID(args[i]?.toString() || "")];
                } else {
                    switch (p.type) {
                        case "boolean":
                            if (args[i] === true || args[i]?.toString().toLowerCase() === "true") {
                                return [p.name, true];
                            } else if (args[i] === false || args[i]?.toString().toLowerCase() === "false") {
                                return [p.name, false];
                            } else {
                                throw new ParameterTypeError(args[i]?.toString() || "null", p.type);
                            }
                        case "number":
                            if (isNaN(parseInt(args[i]?.toString() || "null"))) {
                                throw new ParameterTypeError(args[i]?.toString() || "null", p.type);
                            }
                            return [p.name, parseInt(args[i]?.toString() || "null")];
                        case "string":
                            if (typeof args[i] !== "string") {
                                return [p.name, args[i]?.toString() || "null"];
                            } else {
                                return [p.name, args[i] || "null"];
                            }
                        default:
                            return [p.name, args[i] || "null"];
                    }
                }
            });
            return new Map([...mapEntries]);
        } else {
            return new Map([]);
        }
    }
}
