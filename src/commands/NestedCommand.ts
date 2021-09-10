import { Message } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { CommandRegExps } from "./types/commands.js";
import { NestedCommandInit } from "./types/NestedCommand.js";

export class NestedCommand extends BaseCommand {
    private readonly _children: any[] = [];

    constructor(o: NestedCommandInit) {
        super("CHAT", {
            name: o.name,
            guilds: o.guilds,
            announceSuccess: false,
            function: (i) => {
                if (i instanceof Message) {
                } else {
                    throw new Error("Illegal command call");
                }
            },
        });
        if (!CommandRegExps.chatName.test(o.name)) {
            throw new Error("Incorrect command name. Text and slash commands must match this regular expression: ^[w-]{1,32}$");
        }
    }
}
