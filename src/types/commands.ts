import { BaseCommand } from "../commands/BaseCommand.js";
import { ChatCommand } from "../commands/ChatCommand.js";
import { MessageCommand } from "../commands/MessageCommand.js";
import { UserCommand } from "../commands/UserCommand.js";
import { InputParameter } from "../structures/Parameter.js";

export type CommandStructure<T> = T extends "MESSAGE" ? MessageCommand : T extends "USER" ? UserCommand : T extends "CHAT" ? ChatCommand : BaseCommand;

export type CommandResolvable = BaseCommand | ChatCommand | MessageCommand | UserCommand;

export interface CommandInteractionData {
    command: BaseCommand;
    parameters: InputParameter[];
}
