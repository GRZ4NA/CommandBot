import axios from "axios";
import { Client, CommandInteraction, GuildMember, Intents, Message } from "discord.js";
import { EventEmitter } from "events";
import * as http from "http";
import { Command } from "./Command.js";
import { CommandManager } from "./CommandManager.js";
import { OperationSuccess, PermissionsError } from "./errors.js";
import { HelpMessage } from "./Help.js";
import { SystemMessageManager } from "./SystemMessage.js";
import { CommandMessageStructure } from "./types/Command.js";
import { InitOptions } from "./types/Bot.js";
import { HelpMessageParams } from "./types/HelpMessage.js";
import { applicationState } from "./global/state.js";

export declare interface Bot {
    on(event: "READY", listener: Function): this;
    on(event: "MESSAGE", listener: (m: Message) => void): this;
    on(event: "COMMAND", listener: (m: Message | CommandInteraction, cmdMsg: CommandMessageStructure) => void): this;
    on(event: "ERROR", listener: (e: any) => void): this;
}

/**
 * @class  Class that represents your bot instance
 * @extends {EventEmitter}
 * @exports
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
     * @type {CommandManager}
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
    constructor(options: InitOptions) {
        super();
        this.name = options.name;
        this.client = new Client(
            options.clientOptions || {
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
        this.commands = new CommandManager(options.prefix, options.parameterSeparator);
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
                visible: true,
            },
            system: new SystemMessageManager(this.name),
        };
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
            console.log(`\nBot name: ${this.name}`);
            console.log(`Prefix: ${this.commands.prefix || "/ (only slash commands)"} \n`);
            if (this.token === "") {
                throw new ReferenceError('No token specified. Please pass your Discord application token as an argument to the "start" method or in the constructor');
            }
            if (port) {
                process.stdout.write(`Creating http server on port ${port}... `);
                http.createServer().listen(port);
                console.log("✔");
            }
            if (this.messages.help.enabled === true) {
                const helpMsg: Command = new HelpMessage(this.commands, this.messages.help, this.name);
                this.commands.add(helpMsg);
            }
            applicationState.running = true;
            process.stdout.write("Connecting to Discord... ");
            this.client.login(this.token);
            this.client.on("ready", async () => {
                if (register === undefined || register === true) {
                    console.log("✔");
                    this.register();
                } else {
                    console.log("✔\n");
                }
                this.emit("READY");
            });
            this.client.on("messageCreate", async (m) => {
                let cmdMsg: CommandMessageStructure | null = null;
                try {
                    cmdMsg = this.commands.fetchFromMessage(m);
                    if (cmdMsg) {
                        this.emit("COMMAND", m, cmdMsg);
                        await cmdMsg.command.start(m, cmdMsg.parameters);
                    } else if (this.commands.prefix && m.content.startsWith(this.commands.prefix)) {
                        this.emit("MESSAGE", m);
                        await this.messages.system.send("NOT_FOUND", { phrase: m.content, user: m.member || undefined }, m);
                    } else {
                        this.emit("MESSAGE", m);
                    }
                } catch (e) {
                    if (e instanceof PermissionsError) {
                        await this.messages.system.send(
                            "PERMISSION",
                            {
                                user: m.member || undefined,
                                command: cmdMsg?.command,
                            },
                            m
                        );
                        this.emit("ERROR", e);
                    } else if (e instanceof OperationSuccess) {
                        await this.messages.system.send("SUCCESS", undefined, m);
                    } else {
                        await this.messages.system.send(
                            "ERROR",
                            {
                                command: cmdMsg?.command,
                                user: m.member || undefined,
                                error: e as Error,
                            },
                            m
                        );
                        this.emit("ERROR", e);
                    }
                    return;
                }
            });
            this.client.on("interactionCreate", async (i) => {
                let cmd: CommandMessageStructure | null = null;
                try {
                    if (!i.isCommand()) return;
                    cmd = this.commands.fetchFromInteraction(i);
                    if (cmd) {
                        this.emit("COMMAND", i, cmd);
                        await cmd.command.start(i, cmd.parameters);
                    } else {
                        await this.messages.system.send(
                            "NOT_FOUND",
                            {
                                phrase: i.commandName,
                                user: i.member as GuildMember,
                            },
                            i as CommandInteraction
                        );
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
            return true;
        } catch (e) {
            console.log("❌");
            console.error(`[❌ ERROR] ${e}`);
            return false;
        }
    }

    /**
     * @method
     * Registers commands from {@link CommandManager} in Discord API
     * @returns {Promise<void>}
     */
    public async register(): Promise<void> {
        process.stdout.write("Registering commands... ");
        await axios.put(
            `https://discord.com/api/v8/applications/${this.applicationId}/commands`,
            this.commands.list.filter((c) => !Array.isArray(c.guilds) && c.slash).map((c) => c.toCommandObject()),
            { headers: { Authorization: `Bot ${this.token}` } }
        );
        const guilds: any = {};
        await this.commands.list
            .filter((c) => Array.isArray(c.guilds) && c.guilds.length > 0)
            .map((c) => {
                c.guilds?.map(async (g) => {
                    if (!(await this.client.guilds.fetch(g))) {
                        throw new Error(`"${g}" for "${c.name}" command is not a valid guild ID`);
                    }
                    if (guilds[g]) {
                        guilds[g].push(c.toCommandObject());
                    } else {
                        guilds[g] = [];
                        guilds[g].push(c.toCommandObject());
                    }
                });
            });
        for (let i in guilds) {
            await axios.put(`https://discord.com/api/v8/applications/${this.applicationId}/guilds/${i}/commands`, guilds[i], {
                headers: { Authorization: `Bot ${this.token}` },
            });
        }
        console.log("✔\n");
    }
}

export default Bot;
