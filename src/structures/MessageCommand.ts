import { CommandInteraction } from "discord.js";
import { MessageCommandInit } from "../types/MessageCommand.js";
import { CommandFunctionReturnTypes } from "../types/BaseCommand.js";
import { BaseCommand } from "./BaseCommand.js";

export class MessageCommand extends BaseCommand {
    private readonly function: (i: CommandInteraction) => CommandFunctionReturnTypes;
    public static nameRegExp: RegExp = /^[a-zA-Z]{1,32}$/;

    constructor(o: MessageCommandInit) {
        super({
            name: o.name,
            type: "MESSAGE",
        });
        this.function = o.function;
    }
}
