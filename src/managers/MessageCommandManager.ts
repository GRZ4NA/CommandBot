import { Interaction } from "discord.js";
import { CommandInteractionData } from "../types/commands.js";
import { MessageCommand } from "../structures/MessageCommand.js";
import { CommandManager } from "./CommandManager.js";
import { CommandNotFound } from "../errors.js";
import { Parameter, TargetID, TargetParameter } from "../structures/Parameter.js";

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

    public fetch(i: Interaction): CommandInteractionData | null {
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
        const inputParameter = new TargetParameter(parameter, new TargetID(i.targetId));
        return {
            command: command,
            parameters: [inputParameter],
        };
    }
}
