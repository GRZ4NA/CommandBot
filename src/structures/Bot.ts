import { Client, CommandInteraction, GuildMember, Intents, Message } from "discord.js";
import { EventEmitter } from "events";
import * as http from "http";
import { CommandManager } from "./CommandManager.js";
import { CommandNotFound, OperationSuccess, PermissionsError } from "../errors.js";
import { SystemMessageManager } from "./SystemMessage.js";
import { CommandInteractionData } from "../commands/types/commands.js";
import { InitOptions } from "./types/Bot.js";
import { HelpMessageParams } from "../commands/types/HelpMessage.js";
import { applicationState } from "../state.js";

export declare interface Bot {
    on(event: "READY", listener: Function): this;
    on(event: "MESSAGE", listener: (m: Message) => void): this;
    on(event: "COMMAND", listener: (m: Message | CommandInteraction, cmdMsg: CommandInteractionData) => void): this;
    on(event: "ERROR", listener: (e: any) => void): this;
}

/**
 * @class  Class that represents your bot instance
 * @extends {EventEmitter}
 */
export class Bot extends EventEmitter {
    /**
     * Bot name
     * @type {string}
     */
    public readonly name: string;

    /**
     * Discord.js {@link Client} instance
     * @type {Client}
     */
    public readonly client: Client;

    /**
     * Instance command manager
     * @type {ChatCommandManager}
     */
    public readonly commands: CommandManager;

    /**
     * Discord bot token
     * @type {string}
     */
    public readonly token: string;

    /**
     * Discord API application ID
     * @type {string}
     */
    public readonly applicationId: string;

    /**
     * Built-in messages configuration
     * @type {Object}
     */
    public readonly messages: {
        /**
         * Help message configuration
         * @type {HelpMessageParams}
         */
        help: HelpMessageParams;
        /**
         * {@link SystemMessageManager} storing messages' configuration
         * @type {SystemMessageManager}
         */
        system: SystemMessageManager;
    };

    /**
     * @constructor
     * @param {InitOptions} options - instance properties ({@link InitOptions})
     */
    constructor({ name, token, applicationId, globalPrefix, argumentSeparator, commandSeparator, clientOptions }: InitOptions) {
        super();
        this.name = name;
        this.client = new Client(
            clientOptions || {
                intents: [
                    Intents.FLAGS.GUILDS,
                    Intents.FLAGS.GUILD_BANS,
                    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
                    Intents.FLAGS.GUILD_INTEGRATIONS,
                    Intents.FLAGS.GUILD_INVITES,
                    Intents.FLAGS.GUILD_MEMBERS,
                    Intents.FLAGS.GUILD_MESSAGES,
                    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                    Intents.FLAGS.GUILD_MESSAGE_TYPING,
                    Intents.FLAGS.GUILD_PRESENCES,
                    Intents.FLAGS.GUILD_VOICE_STATES,
                    Intents.FLAGS.GUILD_WEBHOOKS,
                    Intents.FLAGS.DIRECT_MESSAGES,
                    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
                ],
            }
        );
        this.messages = {
            help: {
                enabled: true,
                title: "Help",
                description: "List of all available commands",
                color: "#ff5500",
                usage: "[command name (optional)]",
                bottomText: "List of all available commands",
                visible: true,
            },
            system: new SystemMessageManager(this, this.name),
        };
        this.commands = new CommandManager(this, this.messages.help, globalPrefix, argumentSeparator, commandSeparator);
        this.token = token;
        this.applicationId = applicationId;
    }

    /**
     * @method
     * Starts your Discord bot
     * @param {number} [port] - if specified, the app will create a http server that will be listening on the specified port
     * @param {boolean} [register=true] - if *true* or *undefined*, the bot will register all slash commands in Discord API
     * @returns {Promise<boolean>} whether this operation has been completed successfully
     */
    public async start(port?: number, register?: boolean): Promise<boolean> {
        try {
            if (applicationState.running) {
                throw new Error("This bot is already running");
            }
            if (applicationState.dev) {
                console.warn(`[⚠️ WARNING] You are using an unstable version of the CommandBot package. It is not recommended to use this version in production.`);
            }
            console.log(`\nBot name: ${this.name}`);
            console.log(`Global prefix: ${this.commands.prefix.globalPrefix || "/ (only slash commands)"} \n`);
            if (this.token === "") {
                throw new ReferenceError('No token specified. Please pass your Discord application token as an argument to the "start" method or in the constructor');
            }
            if (port) {
                process.stdout.write(`Creating http server on port ${port}... `);
                http.createServer().listen(port);
                console.log("✔");
            }
            applicationState.running = true;
            process.stdout.write("Connecting to Discord... ");
            this.client.login(this.token);
            this.client.on("ready", async () => {
                if (register === undefined || register === true) {
                    console.log("✔");
                    process.stdout.write(`Registering commands... `);
                    await this.commands.register();
                    console.log("✔");
                } else {
                    console.log("✔\n");
                }
                this.emit("READY");
            });
            this.client.on("messageCreate", async (m) => {
                if (m.author.bot) return;
                let cmdMsg: CommandInteractionData | null = null;
                try {
                    cmdMsg = this.commands.fetch(m);
                    if (cmdMsg) {
                        this.emit("COMMAND", m, cmdMsg);
                        await cmdMsg.command.start(cmdMsg.parameters, m);
                    } else {
                        this.emit("MESSAGE", m);
                    }
                } catch (e) {
                    if (e instanceof PermissionsError) {
                        this.emit("ERROR", e);
                        await this.messages.system.send(
                            "PERMISSION",
                            {
                                user: m.member || undefined,
                                command: cmdMsg?.command,
                            },
                            m
                        );
                    } else if (e instanceof OperationSuccess) {
                        await this.messages.system.send("SUCCESS", undefined, m);
                    } else if (e instanceof CommandNotFound) {
                        await this.messages.system.send("NOT_FOUND", { phrase: e.query, user: m.member || undefined }, m);
                    } else {
                        this.emit("ERROR", e);
                        await this.messages.system.send(
                            "ERROR",
                            {
                                command: cmdMsg?.command,
                                user: m.member || undefined,
                                error: e as Error,
                            },
                            m
                        );
                    }
                    return;
                }
            });
            this.client.on("interactionCreate", async (i) => {
                let cmd: CommandInteractionData | null = null;
                try {
                    cmd = this.commands.fetch(i);
                    if (cmd) {
                        this.emit("COMMAND", i, cmd);
                        await cmd.command.start(cmd.parameters, i, cmd.target);
                    }
                } catch (e) {
                    if (e instanceof PermissionsError) {
                        await this.messages.system.send(
                            "PERMISSION",
                            {
                                user: (i.member as GuildMember) || undefined,
                                command: cmd?.command,
                            },
                            i as CommandInteraction
                        );
                        this.emit("ERROR", e);
                    } else if (e instanceof OperationSuccess) {
                        await this.messages.system.send("SUCCESS", undefined, i as CommandInteraction);
                    } else if (e instanceof CommandNotFound) {
                        await this.messages.system.send("NOT_FOUND", { user: i.user, phrase: e.query }, i);
                    } else {
                        await this.messages.system.send(
                            "ERROR",
                            {
                                command: cmd?.command,
                                user: (i.member as GuildMember) || undefined,
                                error: e as Error,
                            },
                            i as CommandInteraction
                        );
                        this.emit("ERROR", e);
                    }
                    return;
                }
            });
            this.client.on("error", (e) => {
                this.emit("ERROR", e);
            });
            return true;
        } catch (e) {
            console.log("❌");
            console.error(`[❌ ERROR] ${e}`);
            return false;
        }
    }
}

export default Bot;
