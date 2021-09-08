import { BaseCommand } from "../BaseCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { MessageCommand } from "../MessageCommand.js";
import { UserCommand } from "../UserCommand.js";
import { InputParameter } from "../../structures/Parameter.js";
import { CommandType } from "./BaseCommand.js";

export type Command<T extends CommandType | "BASE"> = T extends "CHAT" ? ChatCommand : T extends "MESSAGE" ? MessageCommand : T extends "USER" ? MessageCommand : BaseCommand;

export type CommandList<T extends CommandType | "BASE"> = T extends "CHAT"
    ? readonly ChatCommand[]
    : T extends "MESSAGE"
    ? readonly MessageCommand[]
    : T extends "USER"
    ? readonly MessageCommand[]
    : readonly BaseCommand[];

export type CommandResolvable = BaseCommand | ChatCommand | MessageCommand | UserCommand;

export interface CommandInteractionData<T extends CommandResolvable> {
    command: T;
    parameters: InputParameter[];
}
