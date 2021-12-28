import { Client, ClientOptions, CommandInteraction, GuildMember, Intents, Message } from "discord.js";
import { EventEmitter } from "events";
import * as http from "http";
import { CommandManager } from "./CommandManager.js";
import { CommandNotFound, OperationSuccess, PermissionsError } from "../errors.js";
import { SystemMessageManager } from "./SystemMessage.js";
import { applicationState } from "../state.js";
import { InputManager } from "./InputManager.js";
import { FunctionCommand } from "../commands/base/FunctionCommand.js";
import { HelpMessageParams } from "../commands/Help.js";

/**
 * Main object initialization options
 * @interface
 */
export interface InitOptions {
    /**
     * Bot name
     * @type {string}
     */
    name: string;

    /**
     * Prefix used as a way to trigger the bot using messages in all guilds by default
     * @remarks
     * If *undefined*, you can only interact with bot using slash commands or context menus
     * @type {?string}
     */
    globalPrefix?: string;

    /**
     * Separator used to split user input to a list of {@link InputParameter}s (applies to prefix interactions)
     * @type {?string}
     */
    argumentSeparator?: string;

    /**
     * Separator used to split subcommands when using prefix interactions
     * @type {?string}
     */
    commandSeparator?: string;

    /**
     * Additional [ClientOptions](https://discord.js.org/#/docs/main/stable/typedef/ClientOptions) for Discord.js [Client](https://discord.js.org/#/docs/main/stable/class/Client) object
     * @type {?ClientOptions}
     */
    clientOptions?: ClientOptions;

    /**
     * Help message appearance configuration
     * @type {?HelpMessageParams}
     */
    help?: HelpMessageParams;

    /**
     * Discord bot token
     * @type {string}
     */
    token: string;

    /**
     * Discord API application ID
     * @type {string}
     */
    applicationId: string;
}

export declare interface Bot {
    /**
     * Emitted after connecting to Discord API
     * @event
     */
    on(event: "READY", listener: Function): this;
    /**
     * Emitted whenever bot receives a Discord message
     * @event
     */
    on(event: "MESSAGE", listener: (m: Message) => void): this;
    /**
     * Emitted whenever bots receives a Discord message or interaction that gets recognized as a CommandBot command
     * @event
     */
    on(event: "COMMAND", listener: (m: Message | CommandInteraction, cmdMsg: InputManager) => void): this;
    /**
     * Emitted on every bot error
     * @event
     */
    on(event: "ERROR", listener: (e: any) => void): this;
}

/**
 * Application instance
 * @class
 * @extends {EventEmitter}
 */
export class Bot extends EventEmitter {
    /**
     * Bot name
     * @type {string}
     * @public
     * @readonly
     */
    public readonly name: string;

    /**
     * Discord.js {@link Client} instance
     * @type {Client}
     * @public
     * @readonly
     */
    public readonly client: Client;

    /**
     * Instance command manager
     * @type {CommandManager}
     * @public
     * @readonly
     */
    public readonly commands: CommandManager;

    /**
     * Discord Bot token
     * @type {string}
     * @public
     * @readonly
     */
    public readonly token: string;

    /**
     * Discord API application ID
     * @type {string}
     * @public
     * @readonly
     */
    public readonly applicationId: string;

    /**
     * {@link SystemMessageManager} storing messages' configuration
     * @type {SystemMessageManager}
     * @public
     * @readonly
     */
    public readonly messages: SystemMessageManager;

    /**
     * Main bot constructor
     * @constructor
     * @param {InitOptions} options - instance properties ({@link InitOptions})
     */
    constructor({ name, token, applicationId, globalPrefix, argumentSeparator, commandSeparator, clientOptions, help }: InitOptions) {
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
        this.messages = new SystemMessageManager(this);
        this.commands = new CommandManager(
            this,
            help ?? {
                enabled: true,
                title: "Help",
                description: "List of all available commands",
                color: "#ff5500",
                usage: "[command name (optional)]",
                bottomText: "List of all available commands",
                visible: true,
            },
            globalPrefix,
            argumentSeparator,
            commandSeparator
        );
        this.token = token;
        this.applicationId = applicationId;
    }

    /**
     * Starts your Discord bot
     * @param {?number} [port] - if specified, the app will create a http server that will be listening on the specified port (useful when hosting your bot on platforms like Heroku)
     * @param {?boolean} [register=true] - if *true* or *undefined*, the bot will register all interactions in the Discord API
     * @returns {Promise<boolean>} whether this operation has been completed successfully
     * @public
     * @async
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
                let inputData: InputManager | null = null;
                try {
                    inputData = this.commands.fetch(m);
                    if (inputData) {
                        this.emit("COMMAND", m, inputData);
                        await inputData.command.start(inputData);
                    } else {
                        this.emit("MESSAGE", m);
                    }
                } catch (e) {
                    if (e instanceof PermissionsError) {
                        this.emit("ERROR", e);
                        await this.messages.send(
                            "PERMISSION",
                            {
                                user: m.member || undefined,
                                command: inputData?.command,
                            },
                            m
                        );
                    } else if (e instanceof OperationSuccess) {
                        await this.messages.send("SUCCESS", { command: e.command as FunctionCommand }, m);
                    } else if (e instanceof CommandNotFound) {
                        await this.messages.send("NOT_FOUND", { phrase: e.query, user: m.member || undefined }, m);
                    } else {
                        this.emit("ERROR", e);
                        await this.messages.send(
                            "ERROR",
                            {
                                command: inputData?.command,
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
                let inputData: InputManager | null = null;
                try {
                    inputData = this.commands.fetch(i);
                    if (inputData) {
                        this.emit("COMMAND", i, inputData);
                        await inputData.command.start(inputData);
                    }
                } catch (e) {
                    if (e instanceof PermissionsError) {
                        await this.messages.send(
                            "PERMISSION",
                            {
                                user: (i.member as GuildMember) || undefined,
                                command: inputData?.command,
                            },
                            i as CommandInteraction
                        );
                        this.emit("ERROR", e);
                    } else if (e instanceof OperationSuccess) {
                        await this.messages.send("SUCCESS", { command: e.command as FunctionCommand }, i as CommandInteraction);
                    } else if (e instanceof CommandNotFound) {
                        await this.messages.send("NOT_FOUND", { user: i.user, phrase: e.query }, i);
                    } else {
                        await this.messages.send(
                            "ERROR",
                            {
                                command: inputData?.command,
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
