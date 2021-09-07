import { BaseCommand } from "../structures/BaseCommand.js";
import { ChatCommand } from "../structures/ChatCommand.js";
import { MessageCommand } from "../structures/MessageCommand.js";
import { UserCommand } from "../structures/UserCommand.js";

export type CommandStructure<T> = T extends "MESSAGE" ? MessageCommand : T extends "USER" ? UserCommand : T extends "CHAT" ? ChatCommand : BaseCommand;

export type CommandResolvable = BaseCommand | ChatCommand | MessageCommand | UserCommand;
