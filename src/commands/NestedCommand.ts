import { Message } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { NestedCommandInit } from "./types/NestedCommand.js";

export class NestedCommand extends BaseCommand {
    private readonly _children: any[] = [];
    public static nameRegExp: RegExp = /^[\w-]{1,32}$/;

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
        if (!NestedCommand.nameRegExp.test(o.name)) {
            throw new Error("Incorrect command name. Text and slash commands must match this regular expression: ^[w-]{1,32}$");
        }
    }
}
