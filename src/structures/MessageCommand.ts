import { MessageCommandInit } from "../types/MessageCommand.js";
import { BaseCommand } from "./BaseCommand.js";

export class MessageCommand extends BaseCommand {
    public static nameRegExp: RegExp = /^[a-zA-Z]{1,32}$/;

    constructor(o: MessageCommandInit) {
        if (!MessageCommand.nameRegExp.test(o.name)) {
            throw new Error("Incorrect command name. Command names must have 1-32 characters");
        }
        super("MESSAGE", {
            name: o.name,
            function: o.function,
            announceSuccess: o.announceSuccess,
            guilds: o.guilds,
            permissionCheck: o.permissionCheck,
            permissions: o.permissions,
        });
    }
}