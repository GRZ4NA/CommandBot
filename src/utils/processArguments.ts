import { ChatCommand } from "../commands/ChatCommand.js";
import { SubCommand } from "../commands/SubCommand.js";
import { MissingParameterError, ParameterTypeError } from "../errors.js";
import { ObjectID } from "../structures/parameter.js";
import { ParameterResolvable } from "../structures/types/Parameter.js";

/**
 *
 * @param {ParameterResolvable[]} args - array of input data from Discord
 * @returns {ReadonlyMap<string, ParameterResolvable>} A map containing all input data bound to parameter names
 */
export function processArguments(cmd: ChatCommand | SubCommand, args: ParameterResolvable[]): ReadonlyMap<string, ParameterResolvable> {
    if (cmd.parameters) {
        const mapEntries: [string, ParameterResolvable][] = cmd.parameters.map((p, i) => {
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
