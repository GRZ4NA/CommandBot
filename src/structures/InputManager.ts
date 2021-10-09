import { Command } from "commands/base/Command.js";
import { Interaction, Message } from "discord.js";
import { ParameterType } from "../..";
import { InputParameter, TargetID } from "./parameter.js";
import { InputParameterValue } from "./types/Parameter";

export class InputManager {
    public readonly command: Command;
    public readonly interaction: Interaction | Message;
    public readonly target?: TargetID;
    private readonly arguments: InputParameter<any>[];

    constructor(command: Command, interaction: Interaction | Message, args: InputParameter<any>[], target?: TargetID) {
        this.command = command;
        this.interaction = interaction;
        this.arguments = args;
        this.target = target;
    }

    public get<T extends ParameterType>(query: string, type: T): InputParameterValue<T> | null {
        return (this.arguments.filter((arg) => arg.type === type).find((arg) => arg.name === query)?.value as InputParameterValue<T>) ?? null;
    }
}
