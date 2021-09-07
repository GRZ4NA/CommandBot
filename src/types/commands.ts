import { BaseCommand } from "../structures/BaseCommand.js";
import { ChatCommand } from "../structures/ChatCommand.js";
import { MessageCommand } from "../structures/MessageCommand.js";
import { UserCommand } from "../structures/UserCommand.js";
import { InputParameter } from "../structures/Parameter.js";

export type CommandStructure<T> = T extends "MESSAGE" ? MessageCommand : T extends "USER" ? UserCommand : T extends "CHAT" ? ChatCommand : BaseCommand;

export type CommandResolvable = BaseCommand | ChatCommand | MessageCommand | UserCommand;

export interface CommandInteractionData {
    command: BaseCommand;
    parameters: InputParameter[];
}
