import { CommandInteraction } from "discord.js";
import { CommandFunctionReturnTypes } from "./BaseCommand.js";

export interface MessageCommandInit {
    name: string;
    function: (i: CommandInteraction) => CommandFunctionReturnTypes;
}
