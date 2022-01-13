import { FunctionCommand } from "../commands/base/FunctionCommand.js";
import { Interaction, Message } from "discord.js";
import { ParameterType, InputParameterValue } from "./Parameter.js";
import { InputParameter, TargetID } from "./Parameter.js";

/**
 * Object that stores all interaction input data (target, arguments, content and the interaction itself)
 * @class
 */
export class InputManager {
    /**
     * Command related to this manager
     * @type {FunctionCommand}
     * @public
     * @readonly
     */
    public readonly command: FunctionCommand;
    /**
     * Command interaction or message
     * @type {Interaction | Message}
     * @public
     * @readonly
     */
    public readonly interaction: Interaction | Message;
    /**
     * Command target (when using context menu interactions)
     * @type {?TargetID<any>}
     * @public
     * @readonly
     */
    public readonly target?: TargetID<any>;
    /**
     * All input arguments
     * @type {Array<InputParameter<any>>}
     * @private
     * @readonly
     */
    private readonly arguments: InputParameter<any>[];

    /**
     * @constructor
     * @param {FunctionCommand} command - command related to this manager
     * @param {Interaction | Message} interaction  - interaction or message
     * @param {Array<InputManager<any>>} args - list of input arguments
     * @param {?TargetID<any>} [target] - interaction target (when using context menu interactions)
     */
    constructor(command: FunctionCommand, interaction: Interaction | Message, args: InputParameter<any>[], target?: TargetID<any>) {
        this.command = command;
        this.interaction = interaction;
        this.arguments = args;
        this.target = target;
    }

    /**
     * Get input values
     * @param {string} query - parameter name
     * @param {T} type - parameter type
     * @returns {ParameterResolvable} Argument value bound to a parameter
     * @public
     */
    public get<T extends ParameterType>(query: string, type: T): InputParameterValue<T> | null {
        return (this.arguments.filter((arg) => arg.type === type).find((arg) => arg.name === query)?.value as InputParameterValue<T>) ?? null;
    }
}
