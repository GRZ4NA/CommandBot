import { BaseCommandInit } from "./types/BaseCommand.js";
import { BaseCommand } from "./BaseCommand.js";

export class UserCommand extends BaseCommand {
    public static nameRegExp: RegExp = /^.{1,32}$/;

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

    public static isCommand(o: any): o is UserCommand {
        return BaseCommand.isCommand(o) && UserCommand.nameRegExp.test(o.name);
    }
}
