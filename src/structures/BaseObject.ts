import Bot from "./Bot.js";

export class BaseObject {
    /**
     * Bot client object
     * @type {Bot}
     * @public
     * @readonly
     */
    public readonly client: Bot;

    constructor(client: Bot) {
        this.client = client;
    }
}
