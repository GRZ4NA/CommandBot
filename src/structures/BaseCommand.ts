import { CommandType, BaseCommandInit } from "../types/BaseCommand";

export class BaseCommand {
    /**
     * Command name
     * @type {string}
     */
    public readonly name: string;
    /**
     * Application command type
     * @type {CommandType}
     */
    public readonly type: CommandType;
    public static nameRegExp: RegExp = /^[a-zA-Z]{1,32}$/;

    /**
     * @constructor
     * @param {BaseCommandInit} o - BaseCommand initialization options
     */
    constructor(o: BaseCommandInit) {
        if (BaseCommand.nameRegExp.test(o.name)) {
            this.name = o.name;
        } else {
            throw new Error("Incorrect command name");
        }
        this.type = o.type;
    }
}
