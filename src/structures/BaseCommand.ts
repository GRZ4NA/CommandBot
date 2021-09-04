import { CommandType, BaseCommandInit } from "../types/BaseCommand";

export class BaseCommand {
    public readonly name: string;
    public readonly description: string;
    public readonly type: CommandType;
    public static nameRegExp: RegExp = /^[a-zA-Z]{1,32}$/;
    public static descriptionRegExp: RegExp = /^[a-zA-Z]{1,100}$/;

    constructor(o: BaseCommandInit) {
        if (BaseCommand.nameRegExp.test(o.name)) {
            this.name = o.name;
        } else {
            throw new Error("Incorrect command name");
        }
        if (o.description) {
            if (BaseCommand.descriptionRegExp.test(o.description)) {
                this.description = o.description;
            } else {
                throw new Error("Incorrect command description");
            }
        } else {
            this.description = "No description";
        }
        this.type = o.type;
    }
}
