import { BaseCommand } from "../BaseCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { MessageCommand } from "../MessageCommand.js";
import { UserCommand } from "../UserCommand.js";
import { Interaction, Message } from "discord.js";
import { ParameterResolvable } from "structures/types/Parameter.js";
import { TargetID } from "structures/parameter.js";

export type CommandResolvable = BaseCommand | ChatCommand | MessageCommand | UserCommand;

export interface CommandInteractionData {
    command: BaseCommand;
    parameters: ReadonlyMap<string, ParameterResolvable> | TargetID;
}
