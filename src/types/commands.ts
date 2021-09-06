import { BaseCommand } from "../structures/BaseCommand.js";
import { TextCommand } from "../structures/TextCommand.js";
import { MessageCommand } from "../structures/MessageCommand.js";
import { UserCommand } from "../structures/UserCommand.js";

export type CommandStructure<T> = T extends "MESSAGE" ? MessageCommand : T extends "USER" ? UserCommand : T extends "CHAT" ? TextCommand : BaseCommand;

export type CommandResolvable = BaseCommand | TextCommand | MessageCommand | UserCommand;
