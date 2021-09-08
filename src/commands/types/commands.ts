import { BaseCommand } from "../BaseCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { MessageCommand } from "../MessageCommand.js";
import { UserCommand } from "../UserCommand.js";
import { InputParameter } from "../../structures/Parameter.js";

export type CommandStructure<T> = T extends "MESSAGE" ? MessageCommand : T extends "USER" ? UserCommand : T extends "CHAT" ? ChatCommand : BaseCommand;

export type CommandResolvable = BaseCommand | ChatCommand | MessageCommand | UserCommand;

export interface CommandInteractionData {
    command: BaseCommand;
    parameters: InputParameter[];
}
