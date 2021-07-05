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
interface ConfigurationOptions {
    token?: string;
    helpCommand: boolean;
}
interface ConstructorOptions {
    name: string;
    prefix: string;
    argumentSeparator?: string;
    helpCommand?: boolean;
    clientOptions?: ClientOptions;
    token?: string;
}

//MAIN CLASS
export class Bot extends EventEmitter {
    name: string;
    client: Client;
    commands: CommandManager;
    config: ConfigurationOptions;
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
     * @param {boolean} [options.helpCommand = true] - enable or disable the *help* command
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
        this.config = {
            token: options.token,
            helpCommand:
                options.helpCommand != undefined ? options.helpCommand : true,
        };
        this.messages = {
            help: {
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
            console.log(`Bot name: ${this.name}`);
            console.log(`Prefix: ${this.commands.prefix} \n`);
            const loginToken: string = token || this.config.token || "";
            if (loginToken === "") {
                throw new ReferenceError(
                    'No token specified. Please pass your Discord application token as an argument to the "start" method or in the constructor'
                );
            }
            if (port) {
                console.log(`Creating http server on port ${port}...`);
                http.createServer().listen(port);
            }
            console.log("Starting modules...");
            if (this.config.helpCommand) {
                const helpMsg: Command = new HelpMessage(
                    this.commands,
                    this.messages.help,
                    this.name
                );
                this.commands.add(helpMsg);
            }
            console.log("Connecting to Discord...");
            if (await this.client.login(loginToken)) {
                this.client.on("ready", () => {
                    this.emit("ready");
                });
                this.client.on("message", async (m) => {
                    const cmdMsg: CommandMessageStructure | null =
                        this.commands.fetch(m);
                    if (cmdMsg?.command) {
                        this.emit("command", [m, cmdMsg]);
                        try {
                            await cmdMsg.command.start(m, cmdMsg.arguments);
                        } catch (e) {
                            this.emit("error", [e]);
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
                            return;
                        }
                    } else if (cmdMsg) {
                        this.messages.system.send(
                            "NOT_FOUND",
                            { phrase: m.content, user: m.member || undefined },
                            m.channel
                        );
                    } else {
                        this.emit("message", [m]);
                    }
                });
            } else {
                return false;
            }
            return true;
        } catch (e) {
            console.error(`ERROR! ${e.toString()}`);
            return false;
        }
    }
}

//EXPORTS
export default Bot;
