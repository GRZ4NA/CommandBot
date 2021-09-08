import { BaseCommand } from "../BaseCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { MessageCommand } from "../MessageCommand.js";
import { UserCommand } from "../UserCommand.js";
import { InputParameter } from "../../structures/Parameter.js";
import { Interaction, Message } from "discord.js";

export type CommandResolvable = BaseCommand | ChatCommand | MessageCommand | UserCommand;

export interface CommandInteractionData<T extends Interaction | Message> {
    command: T extends Interaction ? BaseCommand : ChatCommand;
    parameters: InputParameter[];
}
