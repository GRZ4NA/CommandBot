import { FunctionCommand } from "../commands/base/FunctionCommand";
import { Interaction, Message } from "discord.js";
import { ParameterType } from "../..";
import { InputParameter, TargetID } from "./parameter.js";
import { InputParameterValue } from "./types/Parameter";

export class InputManager {
    public readonly command: FunctionCommand;
    public readonly interaction: Interaction | Message;
    public readonly target?: TargetID<any>;
    private readonly arguments: InputParameter<any>[];

    constructor(command: FunctionCommand, interaction: Interaction | Message, args: InputParameter<any>[], target?: TargetID<any>) {
        this.command = command;
        this.interaction = interaction;
        this.arguments = args;
        this.target = target;
    }

    public get<T extends ParameterType>(query: string, type: T): InputParameterValue<T> | null {
        return (this.arguments.filter((arg) => arg.type === type).find((arg) => arg.name === query)?.value as InputParameterValue<T>) ?? null;
    }
}
