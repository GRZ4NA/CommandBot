import { BaseCommandInit } from "../types/BaseCommand.js";
import { BaseCommand } from "./BaseCommand.js";

export class UserCommand extends BaseCommand {
    constructor(o: BaseCommandInit) {
        super("USER", {
            name: o.name,
            announceSuccess: o.announceSuccess,
            function: o.function,
            guilds: o.guilds,
            permissionCheck: o.permissionCheck,
            permissions: o.permissions,
        });
    }
}
