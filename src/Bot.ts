import { Client, GuildMember, Intents, Message, TextChannel } from "discord.js";
import { Command } from "./Command.js";
import { CommandManager } from "./CommandManager.js";
import {
    CommandMessageStructure,
    InitOptions,
    HelpMessageParams,
} from "./types.js";
import { PermissionsError } from "./errors.js";
import { HelpMessage } from "./Help.js";
import * as http from "http";
import { SystemMessageManager } from "./SystemMessage.js";
import { EventEmitter } from "events";
import axios from "axios";

export declare interface Bot {
    on(event: "READY", listener: Function): this;
    on(event: "MESSAGE", listener: (m: Message) => void): this;
    on(
        event: "COMMAND",
        listener: (m: Message, cmdMsg: CommandMessageStructure) => void
    ): this;
    on(event: "ERROR", listener: (e: any) => void): this;
}

export class Bot extends EventEmitter {
    name: string;
    client: Client;
    commands: CommandManager;
    token: string;
    applicationId: string;
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
     * @param {string} [options.argumentSeparator=','] - used to get parameters from message
     * @param {ClientOptions} [options.clientOptions] - client options from Discord.js
     * @param {string} [options.token] - bot token from Discord Developer Portal
     */
    constructor(options: InitOptions) {
        super();
        this.name = options.name;
        this.client = new Client(
            options.clientOptions || { intents: Intents.FLAGS.GUILDS }
        );
        this.commands = new CommandManager(
            options.prefix,
            options.argumentSeparator
        );
        this.token = options.token;
        this.applicationId = options.applicationId;
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
    async start(port?: number, register?: boolean): Promise<boolean> {
        try {
            console.log(`\nBot name: ${this.name}`);
            console.log(`Prefix: ${this.commands.prefix} \n`);
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
            if (this.messages.help.enabled === true) {
                const helpMsg: Command = new HelpMessage(
                    this.commands,
                    this.messages.help,
                    this.name
                );
                this.commands.add(helpMsg);
            }
            process.stdout.write("Connecting to Discord... ");
            this.client.login(this.token);
            this.client.on("ready", async () => {
                if (register === undefined || register === true) {
                    console.log("✔");
                    process.stdout.write("Registering commands... ");
                    await axios.put(
                        `https://discord.com/api/v8/applications/${this.applicationId}/commands`,
                        this.commands.list.map((c) =>
                            !c.guilds ? c.toCommandObject() : {}
                        ),
                        { headers: { Authorization: `Bot ${this.token}` } }
                    );
                    console.log("✔\n");
                } else {
                    console.log("✔\n");
                }
                this.emit("READY");
            });
            this.client.on("messageCreate", async (m) => {
                const cmdMsg = this.commands.fetchFromMessage(m);
                if (cmdMsg) {
                    this.emit("COMMAND", m, cmdMsg);
                    try {
                        await cmdMsg.command.start(m, cmdMsg.parameters);
                    } catch (e) {
                        if (e instanceof PermissionsError) {
                            this.messages.system.send(
                                "PERMISSION",
                                {
                                    user: m.member || undefined,
                                    command: cmdMsg.command,
                                },
                                m.channel as TextChannel
                            );
                        } else {
                            this.messages.system.send(
                                "ERROR",
                                {
                                    command: cmdMsg.command,
                                    user: m.member || undefined,
                                    error: e,
                                },
                                m.channel as TextChannel
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
                        m.channel as TextChannel
                    );
                } else {
                    this.emit("MESSAGE", m);
                }
            });
            this.client.on("interactionCreate", async (i) => {
                if (!i.isCommand()) return;
                const cmd = this.commands.fetchFromInteraction(i);
                if (cmd) {
                    this.emit("COMMAND", i, cmd);
                    try {
                        await cmd.command.start(i, cmd.parameters);
                    } catch (e) {
                        if (e instanceof PermissionsError) {
                            this.messages.system.send(
                                "PERMISSION",
                                {
                                    user:
                                        (i.member as GuildMember) || undefined,
                                    command: cmd.command,
                                },
                                i
                            );
                        } else {
                            this.messages.system.send(
                                "ERROR",
                                {
                                    command: cmd.command,
                                    user:
                                        (i.member as GuildMember) || undefined,
                                    error: e,
                                },
                                i
                            );
                            console.error(e);
                        }
                        this.emit("ERROR", e);
                        return;
                    }
                } else {
                    this.messages.system.send(
                        "NOT_FOUND",
                        {
                            phrase: i.commandName,
                            user: i.member as GuildMember,
                        },
                        i
                    );
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

export default Bot;
