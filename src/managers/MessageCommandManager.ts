import { CommandInteraction } from "discord.js";
import { CommandInteractionData } from "../types/commands";
import { MessageCommand } from "../structures/MessageCommand";
import { CommandManager } from "./CommandManager.js";
import { CommandNotFound } from "errors";
import { ObjectParameter, Parameter } from "structures/Parameter";

export class MessageCommandManager extends CommandManager {
    protected readonly _list: MessageCommand[] = [];

    constructor() {
        super();
    }

    public add(command: MessageCommand) {
        if (MessageCommand.isCommand(command)) {
            super.add(command);
        } else {
            console.error("[❌ ERROR] Incorrect argument type");
        }
    }

    public fetch(i: CommandInteraction): CommandInteractionData | null {
        if (!i.isContextMenu() || i.targetType !== "MESSAGE") return null;
        const command = this.get(i.commandName);
        if (!command) {
            throw new CommandNotFound(i.commandName);
        }
        const parameter = new Parameter({
            name: "target",
            optional: false,
            type: "target",
        });
        const inputParameter = new ObjectParameter(parameter, i.targetId);
        return {
            command: command,
            parameters: [inputParameter],
        };
    }
}
