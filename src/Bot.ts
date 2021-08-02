//IMPORTS
import { Client, ClientOptions, Message } from "discord.js";
import {
    Command,
    CommandManager,
    CommandMessageStructure,
    PermissionsError,
} from "./Command.js";
import { HelpMessage, HelpMessageParams } from "./Help.js";
import * as http from "http";
import { SystemMessageManager } from "./SystemMessage.js";
import { EventEmitter } from "events";

//TYPE DEFINITIONS
export declare interface Bot {
    on(event: "READY", listener: Function): this;
    on(event: "MESSAGE", listener: (m: Message) => void): this;
    on(
        event: "COMMAND",
        listener: (m: Message, cmdMsg: CommandMessageStructure) => void
    ): this;
    on(event: "ERROR", listener: (e: any) => void): this;
}
interface ConstructorOptions {
    name: string;
    prefix: string;
    argumentSeparator?: string;
    clientOptions?: ClientOptions;
    token?: string;
}

//MAIN CLASS
export class Bot extends EventEmitter {
    name: string;
    client: Client;
    commands: CommandManager;
    token: string;
    messages: {
        help: HelpMessageParams;
        system: SystemMessageManager;
    };

    /**
     * Bot instance initializer
     * @constructor
     * @param {ConstructorOptions} options - instance properties
     * @param {string} options.name - name of your bot
     * @param {string} options.prefix - prefix used to call commands
     * @param {string} [options.argumentSeparator=','] - used to get arguments from message
     * @param {ClientOptions} [options.clientOptions] - client options from Discord.js
     * @param {string} [options.token] - bot token from Discord Developer Portal
     */
    constructor(options: ConstructorOptions) {
        super();
        this.name = options.name;
        this.client = new Client(options.clientOptions);
        this.commands = new CommandManager(
            options.prefix,
            options.argumentSeparator
        );
        this.token = options.token || "";
        this.messages = {
            help: {
                enabled: true,
                title: "Help",
                description: "List of all available commands",
                color: "#ff5500",
                usage: "[command name (optional)]",
                bottomText: "List of all available commands",
            },
            system: new SystemMessageManager(this.name),
        };
    }

    /**
     * Starts your Discord bot
     * @param {number} [port] - if specified, the app will create a http server that will be listening on the specified port
     * @param {string} [token] - app token from Discord Developer Portal
     * @returns *Promise<boolean>*
     */
    async start(port?: number, token?: string): Promise<boolean> {
        try {
            console.log(`\nBot name: ${this.name}`);
            console.log(`Prefix: ${this.commands.prefix} \n`);
            this.token = token || this.token;
            if (this.token === "") {
                throw new ReferenceError(
                    'No token specified. Please pass your Discord application token as an argument to the "start" method or in the constructor'
                );
            }
            if (port) {
                process.stdout.write(
                    `Creating http server on port ${port}... `
                );
                http.createServer().listen(port);
                console.log("✔");
            }
            process.stdout.write("Starting modules... ");
            if (this.messages.help.enabled === true) {
                const helpMsg: Command = new HelpMessage(
                    this.commands,
                    this.messages.help,
                    this.name
                );
                this.commands.add(helpMsg);
            }
            console.log("✔");
            process.stdout.write("Connecting to Discord... ");
            await this.client.login(this.token);
            this.client.on("ready", () => {
                console.log("✔\n");
                this.emit("READY");
            });
            this.client.on("message", async (m) => {
                const cmdMsg = this.commands.fetch(m);
                if (cmdMsg) {
                    this.emit("COMMAND", m, cmdMsg);
                    try {
                        await cmdMsg.command.start(m, cmdMsg.arguments);
                    } catch (e) {
                        if (e instanceof PermissionsError) {
                            this.messages.system.send(
                                "PERMISSION",
                                {
                                    user: m.member || undefined,
                                    command: cmdMsg.command,
                                },
                                m.channel
                            );
                        } else {
                            this.messages.system.send(
                                "ERROR",
                                {
                                    command: cmdMsg.command,
                                    user: m.member || undefined,
                                    error: e,
                                },
                                m.channel
                            );
                            console.error(e);
                        }
                        this.emit("ERROR", e);
                        return;
                    }
                } else if (m.content.startsWith(this.commands.prefix)) {
                    this.emit("MESSAGE", m);
                    this.messages.system.send(
                        "NOT_FOUND",
                        { phrase: m.content, user: m.member || undefined },
                        m.channel
                    );
                } else {
                    this.emit("MESSAGE", m);
                }
            });
            return true;
        } catch (e) {
            console.log("❌");
            console.error(`[❌ ERROR] ${e.toString()}`);
            return false;
        }
    }
}

//EXPORTS
export default Bot;
